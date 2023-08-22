import { IDbMember, IDbMemberUpdateData } from '@/repo/member.data'
import MemberRepository from '@/repo/member.repo'
import { areArraysEqual, isObjectEmpty, singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { IMemberData, IMemberIdentity, PlatformType } from '@crowd/types'
import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import { IMemberCreateData, IMemberUpdateData } from './member.data'
import MemberAttributeService from './memberAttribute.service'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'
import IntegrationRepository from '@/repo/integration.repo'
import { OrganizationService } from './organization.service'

export default class MemberService extends LoggerBase {
  constructor(
    private readonly store: DbStore,
    private readonly nodejsWorkerEmitter: NodejsWorkerEmitter,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  public async create(
    tenantId: string,
    segmentId: string,
    integrationId: string,
    data: IMemberCreateData,
    fireSync = true,
  ): Promise<string> {
    try {
      this.log.debug('Creating a new member!')

      if (data.identities.length === 0) {
        throw new Error('Member must have at least one identity!')
      }

      const { id, organizationIds } = await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)
        const txMemberAttributeService = new MemberAttributeService(txStore, this.log)

        let attributes: Record<string, unknown> = {}
        if (data.attributes) {
          attributes = await txMemberAttributeService.validateAttributes(tenantId, data.attributes)

          attributes = await txMemberAttributeService.setAttributesDefaultValues(
            tenantId,
            attributes,
          )
        }

        // check if any weak identities are actually strong
        await this.checkForStrongWeakIdentities(txRepo, tenantId, data)

        const id = await txRepo.create(tenantId, {
          displayName: data.displayName,
          emails: data.emails,
          joinedAt: data.joinedAt.toISOString(),
          attributes,
          weakIdentities: data.weakIdentities || [],
          identities: data.identities,
        })

        await txRepo.addToSegment(id, tenantId, segmentId)

        await txRepo.insertIdentities(id, tenantId, integrationId, data.identities)

        const organizationIds = []
        if (data.organizations) {
          const orgService = new OrganizationService(txStore, this.log)
          for (const org of data.organizations) {
            const id = await orgService.findOrCreate(tenantId, segmentId, org)
            organizationIds.push(id)
          }

          if (organizationIds.length > 0) {
            await orgService.addToMember(tenantId, segmentId, id, organizationIds)
          }
        }

        if (data.emails) {
          const orgIds = await this.assignOrganizationByEmailDomain(
            tenantId,
            segmentId,
            data.emails,
          )
          if (orgIds.length > 0) {
            organizationIds.push(...orgIds)
          }
        }

        return {
          id,
          organizationIds,
        }
      })

      await this.nodejsWorkerEmitter.processAutomationForNewMember(tenantId, id)

      if (fireSync) {
        await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, id)
      }

      if (organizationIds.length > 0) {
        await this.nodejsWorkerEmitter.enrichMemberOrganizations(tenantId, id, organizationIds)
        for (const orgId of organizationIds) {
          await this.searchSyncWorkerEmitter.triggerOrganizationSync(tenantId, orgId)
        }
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
    segmentId: string,
    integrationId: string,
    data: IMemberUpdateData,
    original: IDbMember,
    fireSync = true,
  ): Promise<void> {
    try {
      const { updated, organizationIds } = await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)
        const txMemberAttributeService = new MemberAttributeService(txStore, this.log)
        const dbIdentities = await txRepo.getIdentities(id, tenantId)

        if (data.attributes) {
          data.attributes = await txMemberAttributeService.validateAttributes(
            tenantId,
            data.attributes,
          )
        }

        // check if any weak identities are actually strong
        await this.checkForStrongWeakIdentities(txRepo, tenantId, data, id)

        const toUpdate = MemberService.mergeData(original, dbIdentities, data)

        if (toUpdate.attributes) {
          toUpdate.attributes = await txMemberAttributeService.setAttributesDefaultValues(
            tenantId,
            toUpdate.attributes,
          )
        }

        let updated = false

        if (!isObjectEmpty(toUpdate)) {
          this.log.debug({ memberId: id }, 'Updating a member!')
          await txRepo.update(id, tenantId, {
            emails: toUpdate.emails || original.emails,
            joinedAt: toUpdate.joinedAt || original.joinedAt,
            attributes: toUpdate.attributes || original.attributes,
            weakIdentities: toUpdate.weakIdentities || original.weakIdentities,
            // leave this one empty if nothing changed - we are only adding up new identities not removing them
            identities: toUpdate.identities,
            displayName: toUpdate.displayName || original.displayName,
          })
          await txRepo.addToSegment(id, tenantId, segmentId)

          updated = true
          await txRepo.addToSegment(id, tenantId, segmentId)
        } else {
          this.log.debug({ memberId: id }, 'Nothing to update in a member!')
        }

        if (toUpdate.identities) {
          await txRepo.insertIdentities(id, tenantId, integrationId, toUpdate.identities)
          updated = true
        }

        const organizationIds = []
        if (data.organizations) {
          const orgService = new OrganizationService(txStore, this.log)
          for (const org of data.organizations) {
            const id = await orgService.findOrCreate(tenantId, segmentId, org)
            organizationIds.push(id)
          }

          if (organizationIds.length > 0) {
            await orgService.addToMember(tenantId, segmentId, id, organizationIds)
            updated = true
          }
        }

        if (data.emails) {
          const orgIds = await this.assignOrganizationByEmailDomain(
            tenantId,
            segmentId,
            data.emails,
          )
          if (orgIds.length > 0) {
            organizationIds.push(...orgIds)
          }
        }

        return { updated, organizationIds }
      })

      if (updated && fireSync) {
        await this.searchSyncWorkerEmitter.triggerMemberSync(tenantId, id)
      }

      if (organizationIds.length > 0) {
        await this.nodejsWorkerEmitter.enrichMemberOrganizations(tenantId, id, organizationIds)
        for (const orgId of organizationIds) {
          await this.searchSyncWorkerEmitter.triggerOrganizationSync(tenantId, orgId)
        }
      }
    } catch (err) {
      this.log.error(err, { memberId: id }, 'Error while updating a member!')
      throw err
    }
  }

  public async assignOrganizationByEmailDomain(
    tenantId: string,
    segmentId: string,
    emails: string[],
  ): Promise<string[]> {
    const orgService = new OrganizationService(this.store, this.log)
    const organizationIds: string[] = []
    const emailDomains = new Set<string>()

    // Collect unique domains
    for (const email of emails) {
      const domain = email.split('@')[1]
      emailDomains.add(domain)
    }

    // Assign member to organization based on email domain
    for (const domain of emailDomains) {
      const org = await orgService.findByDomain(tenantId, segmentId, domain as string)
      if (org) {
        organizationIds.push(org.id)
      }
    }

    return organizationIds
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

      if (
        (!member.emails || member.emails.length === 0) &&
        (!member.identities || member.identities.length === 0)
      ) {
        const errorMessage = `Member can't be enriched. It is missing both emails and identities fields.`
        this.log.error(errorMessage)
        throw new Error(errorMessage)
      }

      await this.store.transactionally(async (txStore) => {
        const txRepo = new MemberRepository(txStore, this.log)
        const txIntegrationRepo = new IntegrationRepository(txStore, this.log)

        const dbIntegration = await txIntegrationRepo.findById(integrationId)
        const segmentId = dbIntegration.segmentId

        // first try finding the member using the identity
        const identity = singleOrDefault(member.identities, (i) => i.platform === platform)
        let dbMember = await txRepo.findMember(tenantId, segmentId, platform, identity.username)

        if (!dbMember && member.emails && member.emails.length > 0) {
          const email = member.emails[0]

          // try finding the member using e-mail
          dbMember = await txRepo.findMemberByEmail(tenantId, email)
        }

        if (dbMember) {
          this.log.trace({ memberId: dbMember.id }, 'Found existing member.')

          // set a record in membersSyncRemote to save the sourceId
          // we can't use member.attributes because of segments
          if (member.attributes?.sourceId?.[platform]) {
            await txRepo.addToSyncRemote(
              dbMember.id,
              dbIntegration.id,
              member.attributes?.sourceId?.[platform],
            )
          }

          await this.update(
            dbMember.id,
            tenantId,
            segmentId,
            integrationId,
            {
              attributes: member.attributes,
              emails: member.emails || [],
              joinedAt: member.joinedAt ? new Date(member.joinedAt) : undefined,
              weakIdentities: member.weakIdentities || undefined,
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

  private async checkForStrongWeakIdentities(
    repo: MemberRepository,
    tenantId: string,
    data: IMemberCreateData | IMemberUpdateData,
    memberId?: string,
  ): Promise<void> {
    if (data.weakIdentities && data.weakIdentities.length > 0) {
      const results = await repo.findIdentities(tenantId, data.weakIdentities, memberId)

      const strongIdentities = []

      for (const weakIdentity of data.weakIdentities) {
        if (!results.has(`${weakIdentity.platform}:${weakIdentity.username}`)) {
          strongIdentities.push(weakIdentity)
        }
      }

      if (strongIdentities.length > 0) {
        data.weakIdentities = data.weakIdentities.filter(
          (i) =>
            strongIdentities.find((s) => s.platform === i.platform && s.username === i.username) ===
            undefined,
        )

        for (const identity of strongIdentities) {
          if (
            data.identities.find(
              (i) => i.platform === identity.platform && i.username === identity.username,
            ) === undefined
          ) {
            data.identities.push(identity)
          }
        }
      }
    }
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

      if (newDate.getTime() !== oldDate.getTime()) {
        // pick the oldest
        joinedAt = newDate < oldDate ? newDate.toISOString() : oldDate.toISOString()
      }
    }

    let emails: string[] | undefined
    if (member.emails) {
      if (!areArraysEqual(member.emails, dbMember.emails)) {
        emails = [...new Set([...member.emails, ...dbMember.emails])]
      }
    }

    let weakIdentities: IMemberIdentity[] | undefined
    if (member.weakIdentities && member.weakIdentities.length > 0) {
      const newWeakIdentities: IMemberIdentity[] = []
      for (const identity of member.weakIdentities) {
        if (
          !dbMember.weakIdentities.find(
            (t) => t.platform === identity.platform && t.username === identity.username,
          )
        ) {
          newWeakIdentities.push(identity)
        }
      }

      if (newWeakIdentities.length > 0) {
        weakIdentities = newWeakIdentities
      }
    }

    let identities: IMemberIdentity[] | undefined
    if (member.identities && member.identities.length > 0) {
      const newIdentities: IMemberIdentity[] = []
      for (const identity of member.identities) {
        if (
          !dbIdentities.find(
            (t) => t.platform === identity.platform && t.username === identity.username,
          )
        ) {
          newIdentities.push(identity)
        }
      }

      if (newIdentities.length > 0) {
        identities = newIdentities
      }
    }

    let attributes: Record<string, unknown> | undefined
    if (member.attributes) {
      const temp = mergeWith({}, dbMember.attributes, member.attributes)
      if (!isEqual(temp, dbMember.attributes)) {
        attributes = temp
      }
    }

    return {
      emails,
      joinedAt,
      attributes,
      weakIdentities,
      identities,
      // we don't want to update the display name if it's already set
      // returned value should be undefined here otherwise it will cause an update!
      displayName: dbMember.displayName ? undefined : member.displayName,
    }
  }
}
