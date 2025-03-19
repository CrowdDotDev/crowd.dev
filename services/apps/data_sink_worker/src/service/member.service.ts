import isEqual from 'lodash.isequal'
import mergeWith from 'lodash.mergewith'
import uniqby from 'lodash.uniqby'

import {
  getEarliestValidDate,
  getProperDisplayName,
  isDomainExcluded,
  isEmail,
  isObjectEmpty,
  singleOrDefault,
} from '@crowd/common'
import { SearchSyncWorkerEmitter } from '@crowd/common_services'
import { DbStore } from '@crowd/data-access-layer/src/database'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/integration.repo'
import {
  IDbMember,
  IDbMemberUpdateData,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.data'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.repo'
import { Logger, LoggerBase, getChildLogger, logExecutionTimeV2 } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { Client as TemporalClient } from '@crowd/temporal'
import {
  IMemberData,
  IMemberIdentity,
  IOrganizationIdSource,
  MemberIdentityType,
  OrganizationAttributeSource,
  OrganizationIdentityType,
  OrganizationSource,
  PlatformType,
} from '@crowd/types'

import { IMemberCreateData, IMemberUpdateData } from './member.data'
import MemberAttributeService from './memberAttribute.service'
import { OrganizationService } from './organization.service'

export default class MemberService extends LoggerBase {
  constructor(
    private readonly store: DbStore,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly temporal: TemporalClient,
    private readonly redisClient: RedisClient,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  public async create(
    onboarding: boolean,
    segmentId: string,
    integrationId: string,
    data: IMemberCreateData,
    source: string,
    fireSync = true,
    releaseMemberLock?: () => Promise<void>,
  ): Promise<string> {
    return logExecutionTimeV2(
      async () => {
        try {
          this.log.debug('Creating a new member!')

          // prevent empty identity handles
          data.identities = data.identities.filter((i) => i.value)

          if (data.identities.length === 0) {
            throw new Error('Member must have at least one identity!')
          }

          const { id, organizations } = await this.store.transactionally(async (txStore) => {
            const txRepo = new MemberRepository(txStore, this.log)
            const txMemberAttributeService = new MemberAttributeService(
              this.redisClient,
              txStore,
              this.log,
            )

            let attributes: Record<string, unknown> = {}
            if (data.attributes) {
              attributes = await logExecutionTimeV2(
                () => txMemberAttributeService.validateAttributes(data.attributes),
                this.log,
                'memberService -> create -> validateAttributes',
              )

              attributes = await logExecutionTimeV2(
                () => txMemberAttributeService.setAttributesDefaultValues(attributes),
                this.log,
                'memberService -> create -> setAttributesDefaultValues',
              )
            }

            // validate emails
            data.identities = this.validateEmails(data.identities)

            const id = await logExecutionTimeV2(
              () =>
                txRepo.create({
                  displayName: getProperDisplayName(data.displayName),
                  joinedAt: data.joinedAt.toISOString(),
                  attributes,
                  identities: data.identities,
                  reach: MemberService.calculateReach({}, data.reach),
                }),
              this.log,
              'memberService -> create -> create',
            )

            await logExecutionTimeV2(
              () => txRepo.addToSegment(id, segmentId),
              this.log,
              'memberService -> create -> addToSegment',
            )

            await logExecutionTimeV2(
              () => txRepo.insertIdentities(id, integrationId, data.identities),
              this.log,
              'memberService -> create -> insertIdentities',
            )

            if (releaseMemberLock) {
              await releaseMemberLock()
            }

            const organizations = []
            const orgService = new OrganizationService(txStore, this.log)
            if (data.organizations) {
              for (const org of data.organizations) {
                const id = await logExecutionTimeV2(
                  () => orgService.findOrCreate(source, integrationId, org),
                  this.log,
                  'memberService -> create -> findOrCreateOrg',
                )
                organizations.push({
                  id,
                  source: org.source,
                })
              }
            }

            const emailIdentities = data.identities.filter(
              (i) => i.type === MemberIdentityType.EMAIL && i.verified,
            )
            if (emailIdentities.length > 0) {
              const orgs = await logExecutionTimeV2(
                () =>
                  this.assignOrganizationByEmailDomain(
                    segmentId,
                    integrationId,
                    emailIdentities.map((i) => i.value),
                  ),
                this.log,
                'memberService -> create -> assignOrganizationByEmailDomain',
              )
              if (orgs.length > 0) {
                organizations.push(...orgs)
              }
            }

            if (organizations.length > 0) {
              const uniqOrgs = uniqby(organizations, 'id')
              const orgService = new OrganizationService(txStore, this.log)

              const orgsToAdd = (
                await Promise.all(
                  uniqOrgs.map(async (org) => {
                    // Check if the org was already added to the member in the past, including deleted ones.
                    // If it was, we ignore this org to prevent from adding it again.
                    const existingMemberOrgs = await logExecutionTimeV2(
                      () => orgService.findMemberOrganizations(id, org.id),
                      this.log,
                      'memberService -> create -> findMemberOrganizations',
                    )
                    return existingMemberOrgs.length > 0 ? null : org
                  }),
                )
              ).filter((org) => org !== null)

              if (orgsToAdd.length > 0) {
                await logExecutionTimeV2(
                  () => orgService.addToMember(segmentId, id, orgsToAdd),
                  this.log,
                  'memberService -> create -> addToMember',
                )
              }
            }

            return {
              id,
              organizations,
            }
          })

          if (fireSync) {
            await logExecutionTimeV2(
              () => this.searchSyncWorkerEmitter.triggerMemberSync(id, onboarding, segmentId),
              this.log,
              'memberService -> create -> triggerMemberSync',
            )
          }

          for (const org of organizations) {
            await logExecutionTimeV2(
              () =>
                this.searchSyncWorkerEmitter.triggerOrganizationSync(org.id, onboarding, segmentId),
              this.log,
              'memberService -> create -> triggerOrganizationSync',
            )
          }

          return id
        } catch (err) {
          this.log.error(err, 'Error while creating a new member!')
          throw err
        }
      },
      this.log,
      'memberService -> create',
    )
  }

  public async update(
    id: string,
    onboarding: boolean,
    segmentId: string,
    integrationId: string,
    data: IMemberUpdateData,
    original: IDbMember,
    source: string,
    fireSync = true,
    releaseMemberLock?: () => Promise<void>,
  ): Promise<void> {
    await logExecutionTimeV2(
      async () => {
        this.log.trace({ memberId: id }, 'Updating a member!')

        try {
          const { updated, organizations } = await this.store.transactionally(async (txStore) => {
            const txRepo = new MemberRepository(txStore, this.log)
            const txMemberAttributeService = new MemberAttributeService(
              this.redisClient,
              txStore,
              this.log,
            )

            this.log.trace({ memberId: id }, 'Fetching member identities!')
            const dbIdentities = await logExecutionTimeV2(
              () => txRepo.getIdentities(id),
              this.log,
              'memberService -> update -> getIdentities',
            )

            if (data.attributes) {
              this.log.trace({ memberId: id }, 'Validating member attributes!')
              data.attributes = await logExecutionTimeV2(
                () => txMemberAttributeService.validateAttributes(data.attributes),
                this.log,
                'memberService -> update -> validateAttributes',
              )
            }

            // prevent empty identity handles
            data.identities = data.identities.filter((i) => i.value)

            // validate emails
            data.identities = this.validateEmails(data.identities)

            // make sure displayName is proper
            if (data.displayName) {
              data.displayName = getProperDisplayName(data.displayName)
            }

            const toUpdate = MemberService.mergeData(original, dbIdentities, data)

            if (toUpdate.attributes) {
              this.log.trace({ memberId: id }, 'Setting attribute default values!')
              toUpdate.attributes = await logExecutionTimeV2(
                () => txMemberAttributeService.setAttributesDefaultValues(toUpdate.attributes),
                this.log,
                'memberService -> update -> setAttributesDefaultValues',
              )
            }

            let updated = false
            const identitiesToCreate = toUpdate.identitiesToCreate
            delete toUpdate.identitiesToCreate
            const identitiesToUpdate = toUpdate.identitiesToUpdate
            delete toUpdate.identitiesToUpdate

            if (!isObjectEmpty(toUpdate)) {
              this.log.debug({ memberId: id }, 'Updating a member!')

              const dataToUpdate = Object.entries(toUpdate).reduce((acc, [key, value]) => {
                if (key === 'identities') {
                  return acc
                }

                if (value) {
                  acc[key] = value
                }
                return acc
              }, {} as IDbMemberUpdateData)

              this.log.trace({ memberId: id }, 'Updating member data in db!')

              await logExecutionTimeV2(
                () => txRepo.update(id, dataToUpdate),
                this.log,
                'memberService -> update -> update',
              )

              this.log.trace({ memberId: id }, 'Updating member segment association data in db!')
              await logExecutionTimeV2(
                () => txRepo.addToSegment(id, segmentId),
                this.log,
                'memberService -> update -> addToSegment',
              )

              updated = true
            } else {
              this.log.debug({ memberId: id }, 'Nothing to update in a member!')
              await logExecutionTimeV2(
                () => txRepo.addToSegment(id, segmentId),
                this.log,
                'memberService -> update -> addToSegment',
              )
            }

            if (identitiesToCreate) {
              this.log.trace({ memberId: id }, 'Inserting new identities!')
              await logExecutionTimeV2(
                () => txRepo.insertIdentities(id, integrationId, identitiesToCreate),
                this.log,
                'memberService -> update -> insertIdentities',
              )
              updated = true
            }

            if (identitiesToUpdate) {
              this.log.trace({ memberId: id }, 'Updating identities!')
              await logExecutionTimeV2(
                () => txRepo.updateIdentities(id, identitiesToUpdate),
                this.log,
                'memberService -> update -> updateIdentities',
              )
              updated = true
            }

            if (releaseMemberLock) {
              await releaseMemberLock()
            }

            const organizations = []
            const orgService = new OrganizationService(txStore, this.log)
            if (data.organizations) {
              for (const org of data.organizations) {
                this.log.trace({ memberId: id }, 'Finding or creating organization!')

                const orgId = await logExecutionTimeV2(
                  () => orgService.findOrCreate(source, integrationId, org),
                  this.log,
                  'memberService -> update -> findOrCreateOrg',
                )
                organizations.push({
                  id: orgId,
                  source: data.source,
                })
              }
            }

            const emailIdentities = data.identities.filter(
              (i) => i.verified && i.type === MemberIdentityType.EMAIL,
            )
            if (emailIdentities.length > 0) {
              this.log.trace({ memberId: id }, 'Assigning organization by email domain!')
              const orgs = await logExecutionTimeV2(
                () =>
                  this.assignOrganizationByEmailDomain(
                    segmentId,
                    integrationId,
                    emailIdentities.map((i) => i.value),
                  ),
                this.log,
                'memberService -> update -> assignOrganizationByEmailDomain',
              )
              if (orgs.length > 0) {
                organizations.push(...orgs)
              }
            }

            if (organizations.length > 0) {
              const uniqOrgs = uniqby(organizations, 'id')
              const orgService = new OrganizationService(txStore, this.log)

              this.log.trace({ memberId: id }, 'Finding member organizations!')
              const orgsToAdd = (
                await Promise.all(
                  uniqOrgs.map(async (org) => {
                    // Check if the org was already added to the member in the past, including deleted ones.
                    // If it was, we ignore this org to prevent from adding it again.
                    const existingMemberOrgs = await logExecutionTimeV2(
                      () => orgService.findMemberOrganizations(id, org.id),
                      this.log,
                      'memberService -> update -> findMemberOrganizations',
                    )
                    return existingMemberOrgs.length > 0 ? null : org
                  }),
                )
              ).filter((org) => org !== null)

              if (orgsToAdd.length > 0) {
                this.log.trace({ memberId: id }, 'Adding organizations to member!')
                await logExecutionTimeV2(
                  () => orgService.addToMember(segmentId, id, orgsToAdd),
                  this.log,
                  'memberService -> update -> addToMember',
                )
                updated = true
              }
            }

            return { updated, organizations }
          })

          if (updated && fireSync) {
            this.log.trace({ memberId: id }, 'Triggering member sync!')
            await logExecutionTimeV2(
              () => this.searchSyncWorkerEmitter.triggerMemberSync(id, onboarding, segmentId),
              this.log,
              'memberService -> update -> triggerMemberSync',
            )
          }

          for (const org of organizations) {
            this.log.trace({ memberId: id }, 'Triggering organization sync!')
            await logExecutionTimeV2(
              () =>
                this.searchSyncWorkerEmitter.triggerOrganizationSync(org.id, onboarding, segmentId),
              this.log,
              'memberService -> update -> triggerOrganizationSync',
            )
          }
        } catch (err) {
          this.log.error(err, { memberId: id }, 'Error while updating a member!')
          throw err
        }
      },
      this.log,
      'memberService -> update',
    )
  }

  public async assignOrganizationByEmailDomain(
    segmentId: string,
    integrationId: string,
    emails: string[],
  ): Promise<IOrganizationIdSource[]> {
    const orgService = new OrganizationService(this.store, this.log)
    const organizations: IOrganizationIdSource[] = []
    const emailDomains = new Set<string>()

    // Collect unique domains
    for (const email of emails) {
      if (email) {
        const domain = email.split('@')[1]
        // domain can be undefined if email is invalid
        if (domain) {
          if (!isDomainExcluded(domain)) {
            emailDomains.add(domain)
          }
        }
      }
    }

    // Assign member to organization based on email domain
    for (const domain of emailDomains) {
      const orgId = await orgService.findOrCreate(
        OrganizationAttributeSource.EMAIL,
        integrationId,
        {
          attributes: {
            name: {
              integration: [domain],
            },
          },
          identities: [
            {
              value: domain,
              type: OrganizationIdentityType.PRIMARY_DOMAIN,
              platform: 'email',
              verified: true,
            },
          ],
        },
      )
      if (orgId) {
        organizations.push({
          id: orgId,
          source: OrganizationSource.EMAIL_DOMAIN,
        })
      }
    }

    return organizations
  }

  public async processMemberEnrich(
    integrationId: string,
    platform: PlatformType,
    member: IMemberData,
  ): Promise<void> {
    this.log = getChildLogger('MemberService.processMemberEnrich', this.log, {
      integrationId,
    })

    try {
      this.log.debug('Processing member enrich.')

      const emailIdentities = member.identities.filter(
        (i) => i.verified && i.type === MemberIdentityType.EMAIL,
      )
      if (emailIdentities.length === 0 && (!member.identities || member.identities.length === 0)) {
        const errorMessage = `Member can't be enriched. It is missing both emails and identities fields.`
        this.log.warn(errorMessage)
        return
      }

      await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)
        const txIntegrationRepo = new IntegrationRepository(txStore, this.log)
        const txService = new MemberService(
          txStore,
          this.searchSyncWorkerEmitter,
          this.temporal,
          this.redisClient,
          this.log,
        )

        const dbIntegration = await txIntegrationRepo.findById(integrationId)
        const segmentId = dbIntegration.segmentId

        // first try finding the member using the identity
        const identity = singleOrDefault(
          member.identities,
          (i) =>
            i.platform === platform &&
            i.sourceId !== undefined &&
            i.sourceId !== null &&
            i.type === MemberIdentityType.USERNAME,
        )
        let dbMember = await txRepo.findMemberByUsername(segmentId, platform, identity.value)

        if (!dbMember && emailIdentities.length > 0) {
          const email = emailIdentities[0].value

          // try finding the member using e-mail
          dbMember = await txRepo.findMemberByEmail(email)
        }

        if (dbMember) {
          this.log.trace({ memberId: dbMember.id }, 'Found existing member.')

          await txService.update(
            dbMember.id,
            false,
            segmentId,
            integrationId,
            {
              attributes: member.attributes,
              joinedAt: member.joinedAt ? new Date(member.joinedAt) : undefined,
              identities: member.identities,
              organizations: member.organizations,
              displayName: member.displayName || undefined,
            },
            dbMember,
            platform,
            false,
          )
        } else {
          this.log.debug('No member found for enriching. This member enrich process had no affect.')
        }
      })
    } catch (err) {
      this.log.error(err, 'Error while processing a member enrich!')
      throw err
    }
  }

  public async processMemberUpdate(
    integrationId: string,
    platform: PlatformType,
    member: IMemberData,
  ): Promise<void> {
    this.log = getChildLogger('MemberService.processMemberUpdate', this.log, {
      integrationId,
    })

    try {
      this.log.debug('Processing member update.')

      if (!member.identities || member.identities.length === 0) {
        const errorMessage = `Member can't be updated. It is missing identities fields.`
        this.log.warn(errorMessage)
        return
      }

      await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)
        const txIntegrationRepo = new IntegrationRepository(txStore, this.log)
        const txService = new MemberService(
          txStore,
          this.searchSyncWorkerEmitter,
          this.temporal,
          this.redisClient,
          this.log,
        )

        const dbIntegration = await txIntegrationRepo.findById(integrationId)
        const segmentId = dbIntegration.segmentId

        // first try finding the member using the identity
        const identity = singleOrDefault(
          member.identities,
          (i) => i.platform === platform && i.type === MemberIdentityType.USERNAME,
        )
        const dbMember = await txRepo.findMemberByUsername(segmentId, platform, identity.value)

        if (dbMember) {
          this.log.trace({ memberId: dbMember.id }, 'Found existing member.')

          await txService.update(
            dbMember.id,
            false,
            segmentId,
            integrationId,
            {
              attributes: member.attributes,
              joinedAt: member.joinedAt ? new Date(member.joinedAt) : undefined,
              identities: member.identities,
              organizations: member.organizations,
              displayName: member.displayName || undefined,
              reach: member.reach || undefined,
            },
            dbMember,
            platform,
            false,
          )
        } else {
          this.log.debug('No member found for updating. This member update process had no affect.')
        }
      })
    } catch (err) {
      this.log.error(err, 'Error while processing a member update!')
      throw err
    }
  }

  private validateEmails(identities: IMemberIdentity[]): IMemberIdentity[] {
    const toReturn: IMemberIdentity[] = []

    for (const identity of identities) {
      if (identity.type === MemberIdentityType.EMAIL) {
        // check if email is valid and that the same email doesn't already exists in the array for the same platform
        if (
          isEmail(identity.value) &&
          toReturn.find(
            (i) =>
              i.type === MemberIdentityType.EMAIL &&
              i.value === identity.value &&
              i.platform === identity.platform,
          ) === undefined
        ) {
          toReturn.push({ ...identity, value: identity.value.toLowerCase() })
        }
      } else {
        toReturn.push(identity)
      }
    }

    return toReturn
  }

  private static mergeData(
    dbMember: IDbMember,
    dbIdentities: IMemberIdentity[],
    member: IMemberUpdateData,
  ): IDbMemberUpdateData {
    let joinedAt: string | undefined
    if (member.joinedAt) {
      const newDate = member.joinedAt
      const oldDate = new Date(dbMember.joinedAt)

      joinedAt = getEarliestValidDate(oldDate, newDate).toISOString()
    }

    let identitiesToCreate: IMemberIdentity[] | undefined
    let identitiesToUpdate: IMemberIdentity[] | undefined
    if (member.identities && member.identities.length > 0) {
      const newIdentities: IMemberIdentity[] = []
      const toUpdate: IMemberIdentity[] = []
      for (const identity of member.identities) {
        const dbIdentity = dbIdentities.find(
          (t) =>
            t.platform === identity.platform &&
            t.value === identity.value &&
            t.type === identity.type,
        )
        if (!dbIdentity) {
          newIdentities.push(identity)
        } else if (dbIdentity.verified !== identity.verified) {
          toUpdate.push(identity)
        }
      }

      if (newIdentities.length > 0) {
        identitiesToCreate = newIdentities
      }

      if (toUpdate.length > 0) {
        identitiesToUpdate = toUpdate
      }
    }

    let attributes: Record<string, unknown> | undefined
    if (member.attributes) {
      const temp = mergeWith({}, dbMember.attributes, member.attributes)
      if (!isEqual(temp, dbMember.attributes)) {
        attributes = temp
      }
    }

    let reach: Partial<Record<PlatformType, number>> | undefined
    if (member.reach) {
      const temp = MemberService.calculateReach(dbMember.reach, member.reach)
      if (!isEqual(temp, dbMember.reach)) {
        reach = temp
      }
    }

    return {
      joinedAt,
      attributes,
      identitiesToCreate,
      identitiesToUpdate,
      // we don't want to update the display name if it's already set
      // returned value should be undefined here otherwise it will cause an update!
      displayName: dbMember.displayName ? undefined : member.displayName,
      reach,
    }
  }

  private static calculateReach(
    oldReach: Partial<Record<PlatformType | 'total', number>>,
    newReach: Partial<Record<PlatformType, number>>,
  ) {
    // Totals are recomputed, so we delete them first
    delete oldReach.total
    const out = mergeWith({}, oldReach, newReach)
    if (Object.keys(out).length === 0) {
      return { total: -1 }
    }
    // Total is the sum of all attributes
    out.total = Object.values(out).reduce((a: number, b: number) => a + b, 0)
    return out
  }
}
