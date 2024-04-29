import { Client as TemporalClient, WorkflowIdReusePolicy } from '@crowd/temporal'
import {
  IDbMember,
  IDbMemberUpdateData,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.data'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/member.repo'
import { isObjectEmpty, singleOrDefault, isDomainExcluded, isEmail, EDITION } from '@crowd/common'
import { DbStore } from '@crowd/data-access-layer/src/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import {
  IMemberData,
  IMemberIdentity,
  PlatformType,
  OrganizationSource,
  IOrganizationIdSource,
  TemporalWorkflowId,
  MemberIdentityType,
  Edition,
} from '@crowd/types'
import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import moment from 'moment-timezone'
import { IMemberCreateData, IMemberUpdateData } from './member.data'
import MemberAttributeService from './memberAttribute.service'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/integration.repo'
import { OrganizationService } from './organization.service'
import uniqby from 'lodash.uniqby'
import { Unleash } from '@crowd/feature-flags'
import { TEMPORAL_CONFIG } from '../conf'
import { RedisClient } from '@crowd/redis'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/common_services'

export default class MemberService extends LoggerBase {
  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly unleash: Unleash | undefined,
    private readonly temporal: TemporalClient,
    private readonly redisClient: RedisClient,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  public async create(
    tenantId: string,
    onboarding: boolean,
    segmentId: string,
    integrationId: string,
    data: IMemberCreateData,
    fireSync = true,
    releaseMemberLock?: () => Promise<void>,
  ): Promise<string> {
    try {
      this.log.debug('Creating a new member!')

      // prevent empty identity handles & lowercase values
      data.identities = data.identities.filter((i) => i.value).map((i) => ({...i, value: i.value.toLowerCase()}))

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
          attributes = await txMemberAttributeService.validateAttributes(tenantId, data.attributes)

          attributes = await txMemberAttributeService.setAttributesDefaultValues(
            tenantId,
            attributes,
          )
        }

        // validate emails
        data.identities = this.validateEmails(data.identities)

        const id = await txRepo.create(tenantId, {
          displayName: data.displayName,
          joinedAt: data.joinedAt.toISOString(),
          attributes,
          identities: data.identities,
          reach: MemberService.calculateReach({}, data.reach),
        })

        await txRepo.addToSegment(id, tenantId, segmentId)

        await txRepo.insertIdentities(id, tenantId, integrationId, data.identities)

        if (releaseMemberLock) {
          await releaseMemberLock()
        }

        const organizations = []
        const orgService = new OrganizationService(txStore, this.log)
        if (data.organizations) {
          for (const org of data.organizations) {
            const id = await orgService.findOrCreate(tenantId, segmentId, integrationId, org)
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
          const orgs = await this.assignOrganizationByEmailDomain(
            tenantId,
            segmentId,
            integrationId,
            emailIdentities.map((i) => i.value),
          )
          if (orgs.length > 0) {
            organizations.push(...orgs)
          }
        }

        if (organizations.length > 0) {
          // remove dups
          const uniqOrganizations = uniqby(organizations, 'id')
          await orgService.addToMember(tenantId, segmentId, id, uniqOrganizations)
        }

        return {
          id,
          organizations,
        }
      })

      if (EDITION !== Edition.LFX) {
        try {
          const handle = await this.temporal.workflow.start('processNewMemberAutomation', {
            workflowId: `${TemporalWorkflowId.NEW_MEMBER_AUTOMATION}/${id}`,
            taskQueue: TEMPORAL_CONFIG().automationsTaskQueue,
            workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_REJECT_DUPLICATE,
            retry: {
              maximumAttempts: 100,
            },

            args: [
              {
                tenantId,
                memberId: id,
              },
            ],
            searchAttributes: {
              TenantId: [tenantId],
            },
          })

          this.log.info(
            { workflowId: handle.workflowId },
            'Started temporal workflow to process new member automation!',
          )
        } catch (err) {
          this.log.error(
            err,
            'Error while starting temporal workflow to process new member automation!',
          )
          throw err
        }
      }

      if (fireSync) {
        await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, id, onboarding, segmentId)
      }

      for (const org of organizations) {
        await this.searchSyncWorkerEmitter.triggerOrganizationSync(
          tenantId,
          org.id,
          onboarding,
          segmentId,
        )
      }

      return id
    } catch (err) {
      this.log.error(err, 'Error while creating a new member!')
      throw err
    }
  }

  public async update(
    id: string,
    tenantId: string,
    onboarding: boolean,
    segmentId: string,
    integrationId: string,
    data: IMemberUpdateData,
    original: IDbMember,
    fireSync = true,
    releaseMemberLock?: () => Promise<void>,
  ): Promise<void> {
    try {
      const { updated, organizations } = await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)
        const txMemberAttributeService = new MemberAttributeService(
          this.redisClient,
          txStore,
          this.log,
        )
        const dbIdentities = await txRepo.getIdentities(id, tenantId)

        if (data.attributes) {
          data.attributes = await txMemberAttributeService.validateAttributes(
            tenantId,
            data.attributes,
          )
        }

        // prevent empty identity handles & lowercase values
        data.identities = data.identities.filter((i) => i.value).map((i) => ({...i, value: i.value.toLowerCase()}))

        // validate emails
        data.identities = this.validateEmails(data.identities)

        const toUpdate = MemberService.mergeData(original, dbIdentities, data)

        if (toUpdate.attributes) {
          toUpdate.attributes = await txMemberAttributeService.setAttributesDefaultValues(
            tenantId,
            toUpdate.attributes,
          )
        }

        let updated = false
        const identitiesToCreate = toUpdate.identitiesToCreate
        delete toUpdate.identitiesToCreate
        const identitiesToUpdate = toUpdate.identitiesToUpdate
        delete toUpdate.identitiesToUpdate

        if (!isObjectEmpty(toUpdate)) {
          this.log.debug({ memberId: id }, 'Updating a member!')

          const dateToUpdate = Object.entries(toUpdate).reduce((acc, [key, value]) => {
            if (key === 'identities') {
              return acc
            }

            if (value) {
              acc[key] = value
            }
            return acc
          }, {} as IDbMemberUpdateData)

          await txRepo.update(id, tenantId, dateToUpdate)
          await txRepo.addToSegment(id, tenantId, segmentId)

          updated = true
        } else {
          this.log.debug({ memberId: id }, 'Nothing to update in a member!')
          await txRepo.addToSegment(id, tenantId, segmentId)
        }

        if (identitiesToCreate) {
          await txRepo.insertIdentities(id, tenantId, integrationId, identitiesToCreate)
          updated = true
        }

        if (identitiesToUpdate) {
          await txRepo.updateIdentities(id, tenantId, identitiesToUpdate)
          updated = true
        }

        if (releaseMemberLock) {
          await releaseMemberLock()
        }

        const organizations = []
        const orgService = new OrganizationService(txStore, this.log)
        if (data.organizations) {
          for (const org of data.organizations) {
            const id = await orgService.findOrCreate(tenantId, segmentId, integrationId, org)
            organizations.push({
              id,
              source: data.source,
            })
          }

          if (organizations.length > 0) {
            await orgService.addToMember(tenantId, segmentId, id, organizations)
            updated = true
          }
        }

        const emailIdentities = data.identities.filter(
          (i) => i.verified && i.type === MemberIdentityType.EMAIL,
        )
        if (emailIdentities.length > 0) {
          const orgs = await this.assignOrganizationByEmailDomain(
            tenantId,
            segmentId,
            integrationId,
            emailIdentities.map((i) => i.value),
          )
          if (orgs.length > 0) {
            organizations.push(...orgs)
          }
        }

        if (organizations.length > 0) {
          // remove dups
          const uniqOrganizations = uniqby(organizations, 'id')
          await orgService.addToMember(tenantId, segmentId, id, uniqOrganizations)
          updated = true
        }

        return { updated, organizations }
      })

      if (updated && fireSync) {
        await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, id, onboarding, segmentId)
      }

      for (const org of organizations) {
        await this.searchSyncWorkerEmitter.triggerOrganizationSync(
          tenantId,
          org.id,
          onboarding,
          segmentId,
        )
      }
    } catch (err) {
      this.log.error(err, { memberId: id }, 'Error while updating a member!')
      throw err
    }
  }

  public async assignOrganizationByEmailDomain(
    tenantId: string,
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
      const orgId = await orgService.findOrCreate(tenantId, segmentId, integrationId, {
        website: domain,
        identities: [
          {
            name: domain,
            platform: 'email',
          },
        ],
      })
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
    tenantId: string,
    integrationId: string,
    platform: PlatformType,
    member: IMemberData,
  ): Promise<void> {
    this.log = getChildLogger('MemberService.processMemberEnrich', this.log, {
      integrationId,
      tenantId,
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
          this.nodejsWorkerEmitter,
          this.searchSyncWorkerEmitter,
          this.unleash,
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
        let dbMember = await txRepo.findMemberByUsername(
          tenantId,
          segmentId,
          platform,
          identity.value,
        )

        if (!dbMember && emailIdentities.length > 0) {
          const email = emailIdentities[0].value

          // try finding the member using e-mail
          dbMember = await txRepo.findMemberByEmail(tenantId, email)
        }

        if (dbMember) {
          this.log.trace({ memberId: dbMember.id }, 'Found existing member.')

          // set a record in membersSyncRemote to save the sourceId
          // these rows will be used for outgoing data
          if (member.attributes?.sourceId?.[platform]) {
            await txRepo.addToSyncRemote(
              dbMember.id,
              dbIntegration.id,
              member.attributes?.sourceId?.[platform],
            )
          }

          await txService.update(
            dbMember.id,
            tenantId,
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
    tenantId: string,
    integrationId: string,
    platform: PlatformType,
    member: IMemberData,
  ): Promise<void> {
    this.log = getChildLogger('MemberService.processMemberUpdate', this.log, {
      integrationId,
      tenantId,
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
          this.nodejsWorkerEmitter,
          this.searchSyncWorkerEmitter,
          this.unleash,
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
        const dbMember = await txRepo.findMemberByUsername(
          tenantId,
          segmentId,
          platform,
          identity.value,
        )

        if (dbMember) {
          this.log.trace({ memberId: dbMember.id }, 'Found existing member.')

          await txService.update(
            dbMember.id,
            tenantId,
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
          toReturn.push(identity)
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
      // If either the new or the old date are earlier than 1970
      // it means they come from an activity without timestamp
      // and we want to keep the other one
      if (moment(oldDate).subtract(5, 'days').unix() < 0) {
        joinedAt = newDate.toISOString()
      }
      if (moment(newDate).unix() < 0) {
        joinedAt = undefined
      }

      if (oldDate <= newDate) {
        // we already have the oldest date in the db, so we don't need to update it
        joinedAt = undefined
      } else {
        // we have a new date and it's older, so we need to update it
        joinedAt = newDate.toISOString()
      }
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
