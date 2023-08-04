import { NANGO_CONFIG, SERVICE_CONFIG } from '@/conf'
import { MemberRepository } from '../repo/member.repo'
import { Entity, IMember, OpenSearchIndex, PlatformType } from '@crowd/types'
import { singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { Edition } from '@crowd/types'
import { ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { IntegrationRepository } from '@/repo/integration.repo'
import { FieldTranslatorFactory, OpensearchQueryParser } from '@crowd/opensearch'
import {
  IBatchCreateMemberResult,
  IIntegrationProcessRemoteSyncContext,
  INTEGRATION_SERVICES,
} from '@crowd/integrations'
import { IDbIntegration } from '@/repo/integration.data'
import { SearchSyncWorkerEmitter } from '@crowd/sqs'
import { AutomationRepository } from '@/repo/automation.repo'

export class MemberSyncService extends LoggerBase {
  private readonly memberRepo: MemberRepository
  private readonly integrationRepo: IntegrationRepository
  private readonly automationRepo: AutomationRepository

  constructor(
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    private readonly searchSyncEmitter: SearchSyncWorkerEmitter,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.memberRepo = new MemberRepository(store, this.log)
    this.integrationRepo = new IntegrationRepository(store, this.log)
    this.automationRepo = new AutomationRepository(store, this.log)
  }

  public async syncMember(
    tenantId: string,
    integrationId: string,
    memberId: string,
    syncRemoteId: string,
  ): Promise<void> {
    const integration = await this.integrationRepo.findById(integrationId)

    const member = await this.memberRepo.findMember(memberId)

    const syncRemote = await this.memberRepo.findSyncRemoteById(syncRemoteId)

    const membersToCreate = []
    const membersToUpdate = []

    if (syncRemote.sourceId) {
      membersToUpdate.push(member)
    } else {
      membersToCreate.push(member)
    }

    const service = singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.platform)

    if (service.processSyncRemote) {
      const context: IIntegrationProcessRemoteSyncContext = {
        integration,
        log: this.log,
        serviceSettings: {
          nangoId: `${tenantId}-${integration.platform}`,
          nangoUrl: NANGO_CONFIG().url,
          nangoSecretKey: NANGO_CONFIG().secretKey,
        },
        tenantId,
      }

      const newMembers = await service.processSyncRemote<IMember>(
        membersToCreate,
        membersToUpdate,
        Entity.MEMBERS,
        context,
      )

      if (newMembers.length > 0) {
        const memberCreated = newMembers[0] as IBatchCreateMemberResult
        await this.memberRepo.setSyncRemoteSourceId(syncRemoteId, memberCreated.sourceId)
      }
      await this.memberRepo.setLastSyncedAtBySyncRemoteId(syncRemoteId)
    } else {
      this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
    }
  }

  public async syncAllMarkedMembers(
    tenantId: string,
    integrationId: string,
    batchSize = 100,
  ): Promise<void> {
    const integration: IDbIntegration = await this.integrationRepo.findById(integrationId)

    const platforms = await this.memberRepo.getExistingPlatforms(tenantId)

    const attributes = await this.memberRepo.getTenantMemberAttributes(tenantId)

    const isMultiSegment = SERVICE_CONFIG().edition === Edition.LFX

    const translator = FieldTranslatorFactory.getTranslator(OpenSearchIndex.MEMBERS, attributes, [
      'default',
      'custom',
      'crowd',
      'enrichment',
      integration.platform, // it could be that no members have the outgoing identity yet, but member could be marked through attributes
      ...platforms,
    ])

    let markedMembers
    let offset

    do {
      const membersToCreate: IMember[] = []
      const membersToUpdate: IMember[] = []

      offset = markedMembers ? offset + batchSize : 0
      markedMembers = await this.memberRepo.findMarkedMembers(integration.id, batchSize, offset)

      while (markedMembers.length > 0) {
        const memberToSync = markedMembers.shift()

        this.log.trace(`Syncing member ${memberToSync.memberId} to ${integration.platform} remote!`)

        // find member in opensearch
        const query = {
          bool: {
            must: [
              {
                term: {
                  [`uuid_memberId`]: memberToSync.memberId,
                },
              },
            ],
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any

        if (isMultiSegment) {
          query.must.push({
            term: {
              uuid_segmentId: integration.segmentId,
            },
          })
        }

        const memberFromOpensearch = (await this.openSearchService.search(
          OpenSearchIndex.MEMBERS,
          query,
          undefined,
          1,
          undefined,
          undefined,
        )) as ISearchHit<IMember>[]

        const translatedMembers: IMember[] = memberFromOpensearch.reduce((acc, member) => {
          const membersWithCrowdFields = translator.translateObjectToCrowd(member._source)
          acc.push(membersWithCrowdFields)
          return acc
        }, [])

        if (translatedMembers.length !== 1) {
          this.log.warn('Found more than one member matching the id from opensearch - exiting!')
          return
        }

        if (memberToSync.sourceId) {
          // append sourceId to object - it'll be used for updating the remote counterpart
          translatedMembers[0].attributes = {
            ...translatedMembers[0].attributes,
            sourceId: {
              [integration.platform]: memberToSync.sourceId,
            },
          }
          membersToUpdate.push(translatedMembers[0])
        } else {
          membersToCreate.push(translatedMembers[0])
        }
      }

      const service = singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.platform)

      if (service.processSyncRemote) {
        const context: IIntegrationProcessRemoteSyncContext = {
          integration,
          log: this.log,
          serviceSettings: {
            nangoId: `${tenantId}-${integration.platform}`,
            nangoUrl: NANGO_CONFIG().url,
            nangoSecretKey: NANGO_CONFIG().secretKey,
          },
          tenantId,
        }

        const newMembers = await service.processSyncRemote<IMember>(
          membersToCreate,
          membersToUpdate,
          Entity.MEMBERS,
          context,
        )

        for (const newMember of newMembers as IBatchCreateMemberResult[]) {
          await this.memberRepo.setIntegrationSourceId(
            newMember.memberId,
            integration.id,
            newMember.sourceId,
          )
          await this.memberRepo.setLastSyncedAt(newMember.memberId, integration.id)
        }

        for (const updatedMember of membersToUpdate) {
          await this.memberRepo.setLastSyncedAt(updatedMember.id, integration.id)
        }
      } else {
        this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
      }
    } while (markedMembers.length > 0)
  }

  public async syncAllFilteredMembers(
    tenantId: string,
    integrationId: string,
    automationId: string,
    batchSize = 50,
  ) {
    const integration: IDbIntegration = await this.integrationRepo.findById(integrationId)
    const automation = await this.automationRepo.findById(automationId)

    const platforms = await this.memberRepo.getExistingPlatforms(tenantId)

    const attributes = await this.memberRepo.getTenantMemberAttributes(tenantId)

    const isMultiSegment = SERVICE_CONFIG().edition === Edition.LFX

    const translator = FieldTranslatorFactory.getTranslator(OpenSearchIndex.MEMBERS, attributes, [
      'default',
      'custom',
      'crowd',
      'enrichment',
      automation.type, // it could be that no members have the outgoing identity yet, but member could be marked through attributes
      ...platforms,
    ])

    const parseOptions = {
      filter: automation.settings.filter,
      limit: batchSize,
      offset: 0,
      orderBy: 'createdAt_DESC',
    }

    const parsed = OpensearchQueryParser.parse(parseOptions, OpenSearchIndex.MEMBERS, translator)

    // only get members that aren't marked as sync yet
    // parsed.query.bool.must.push({
    //   bool: {
    //     should: [
    //       {
    //         bool: {
    //           must_not: {
    //             exists: {
    //               field: `obj_attributes.obj_syncRemote.bool_${integration.platform}`,
    //             },
    //           },
    //         },
    //       },
    //       {
    //         term: {
    //           [`obj_attributes.obj_syncRemote.bool_${integration.platform}`]: false,
    //         },
    //       },
    //     ],
    //     minimum_should_match: 1,
    //   },
    // })

    // add tenant filter
    parsed.query.bool.must.push({
      term: {
        [`uuid_tenantId`]: tenantId,
      },
    })

    // discard team members, bots and organizations
    parsed.query.bool.must.push({
      bool: {
        must: [
          {
            bool: {
              must_not: {
                term: {
                  [`obj_attributes.obj_isTeamMember.bool_default`]: true,
                },
              },
            },
          },
          {
            bool: {
              must_not: {
                term: {
                  [`obj_attributes.obj_isBot.bool_default`]: true,
                },
              },
            },
          },
          {
            bool: {
              must_not: {
                term: {
                  [`obj_attributes.obj_isOrganization.bool_default`]: true,
                },
              },
            },
          },
        ],
      },
    })

    if (isMultiSegment) {
      parsed.query.bool.must.push({
        term: {
          uuid_segmentId: integration.segmentId,
        },
      })
    }

    let filteredMembers
    let offset

    this.log.trace(
      { filter: automation.settings.filter },
      'Trying to sync members that conform to sent filter!',
    )

    do {
      const membersToCreate: IMember[] = []
      const membersToUpdate: IMember[] = []

      offset = filteredMembers ? offset + batchSize : 0
      parsed.from = offset

      filteredMembers = await this.openSearchService.client.search({
        index: OpenSearchIndex.MEMBERS,
        body: parsed,
      })

      this.log.trace('Found members: ')
      this.log.trace(filteredMembers)

      const translatedMembers: IMember[] = filteredMembers.body.hits.hits.reduce((acc, member) => {
        const membersWithCrowdFields = translator.translateObjectToCrowd(member._source)
        acc.push(membersWithCrowdFields)
        return acc
      }, [])

      while (translatedMembers.length > 0) {
        const memberToSync = translatedMembers.shift()

        this.log.trace(`Syncing member ${memberToSync.id} to ${integration.platform} remote!`)

        let syncRemote = await this.memberRepo.findSyncRemote(
          memberToSync.id,
          integration.id,
          automation.id,
        )

        // member isn't marked yet, mark it
        if (!syncRemote) {
          syncRemote = await this.memberRepo.markMemberForSyncing({
            integrationId: integration.id,
            memberId: memberToSync.id,
            metaData: null,
            syncFrom: automation.id,
          })
        }

        if (syncRemote.sourceId) {
          memberToSync.attributes = {
            ...memberToSync.attributes,
            sourceId: {
              [integration.platform]: syncRemote.sourceId,
            },
          }
          membersToUpdate.push(memberToSync)
        } else {
          membersToCreate.push(memberToSync)
        }
      }

      const service = singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.platform)

      if (service.processSyncRemote) {
        const context: IIntegrationProcessRemoteSyncContext = {
          integration,
          log: this.log,
          serviceSettings: {
            nangoId: `${tenantId}-${integration.platform}`,
            nangoUrl: NANGO_CONFIG().url,
            nangoSecretKey: NANGO_CONFIG().secretKey,
          },
          tenantId,
          automation,
        }

        const newMembers = await service.processSyncRemote<IMember>(
          membersToCreate,
          membersToUpdate,
          Entity.MEMBERS,
          context,
        )

        for (const newMember of newMembers as IBatchCreateMemberResult[]) {
          await this.memberRepo.setIntegrationSourceId(
            newMember.memberId,
            integration.id,
            newMember.sourceId,
          )

          await this.memberRepo.setLastSyncedAt(newMember.memberId, integration.id)
        }

        for (const updatedMember of membersToUpdate) {
          await this.memberRepo.setLastSyncedAt(updatedMember.id, integration.id)
        }
      } else {
        this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
      }
    } while (filteredMembers.length > 0)
  }

  public async syncOrganizationMembers(
    tenantId: string,
    integrationId: string,
    automationId: string,
    organizationId: string,
    batchSize = 100,
  ) {
    const integration: IDbIntegration = await this.integrationRepo.findById(integrationId)

    const automation = await this.automationRepo.findById(automationId)

    let organizationMembers
    let offset

    do {
      const membersToCreate: IMember[] = []
      const membersToUpdate: IMember[] = []

      offset = organizationMembers ? offset + batchSize : 0
      organizationMembers = await this.memberRepo.findOrganizationMembers(
        organizationId,
        batchSize,
        offset,
      )

      while (organizationMembers.length > 0) {
        const memberToSync = organizationMembers.shift()

        this.log.trace(`Syncing member ${memberToSync.memberId} to ${integration.platform} remote!`)
        const member = await this.memberRepo.findMember(memberToSync.memberId)

        let syncRemote = await this.memberRepo.findSyncRemote(
          member.id,
          integration.id,
          automation.id,
        )

        // member isn't marked yet, mark it
        if (!syncRemote) {
          syncRemote = await this.memberRepo.markMemberForSyncing({
            integrationId: integration.id,
            memberId: member.id,
            metaData: null,
            syncFrom: automation.id,
          })
        }

        if (syncRemote.sourceId) {
          member.attributes = {
            ...member.attributes,
            sourceId: {
              [integration.platform]: syncRemote.sourceId,
            },
          }
          membersToUpdate.push(member)
        } else {
          membersToCreate.push(member)
        }
      }

      const service = singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.platform)

      if (service.processSyncRemote) {
        const context: IIntegrationProcessRemoteSyncContext = {
          integration,
          log: this.log,
          serviceSettings: {
            nangoId: `${tenantId}-${integration.platform}`,
            nangoUrl: NANGO_CONFIG().url,
            nangoSecretKey: NANGO_CONFIG().secretKey,
          },
          tenantId,
        }

        const newMembers = await service.processSyncRemote<IMember>(
          membersToCreate,
          membersToUpdate,
          Entity.MEMBERS,
          context,
        )

        for (const newMember of newMembers as IBatchCreateMemberResult[]) {
          await this.memberRepo.setIntegrationSourceId(
            newMember.memberId,
            integration.id,
            newMember.sourceId,
          )
          await this.memberRepo.setLastSyncedAt(newMember.memberId, integration.id)
        }

        for (const updatedMember of membersToUpdate) {
          await this.memberRepo.setLastSyncedAt(updatedMember.id, integration.id)
        }
      } else {
        this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
      }
    } while (organizationMembers.length > 0)
  }
}
