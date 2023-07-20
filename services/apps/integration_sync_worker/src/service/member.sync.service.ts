import { NANGO_CONFIG, SERVICE_CONFIG } from '@/conf'
import { MemberRepository } from '../repo/member.repo'
import { IMember, OpenSearchIndex, PlatformType } from '@crowd/types'
import { singleOrDefault } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { Edition } from '@crowd/types'
import { ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { IntegrationRepository } from '@/repo/integration.repo'
import { FieldTranslatorFactory } from '@crowd/opensearch'
import { IIntegrationProcessRemoteSyncContext, INTEGRATION_SERVICES } from '@crowd/integrations'
import { IDbIntegration } from '@/repo/integration.data'
import { SearchSyncWorkerEmitter } from '@crowd/sqs'

export class MemberSyncService extends LoggerBase {
  private readonly memberRepo: MemberRepository
  public readonly integrationRepo: IntegrationRepository

  constructor(
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    private readonly searchSyncEmitter: SearchSyncWorkerEmitter,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.memberRepo = new MemberRepository(store, this.log)
    this.integrationRepo = new IntegrationRepository(store, this.log)
  }

  public async syncMember(
    tenantId: string,
    integrationId: string,
    memberId: string,
  ): Promise<void> {
    const integration = await this.integrationRepo.findById(integrationId)

    const platforms = await this.memberRepo.getExistingPlatforms(tenantId)

    const attributes = await this.memberRepo.getTenantMemberAttributes(tenantId)

    const member = await this.memberRepo.findMember(memberId)

    const membersToCreate = []
    const membersToUpdate = []

    if (member.attributes?.sourceId?.[integration.platform]) {
      membersToUpdate.push(member)
    } else {
      membersToCreate.push(member)
    }

    const service = singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.platform)

    if (service.processSyncRemote) {
      const context: IIntegrationProcessRemoteSyncContext = {
        integration,
        log: this.log,
        memberAttributes: attributes,
        platforms: platforms.map((p) => ({ platform: p, username: null })),
        serviceSettings: {
          nangoId: `${tenantId}-${integration.platform}`,
          nangoUrl: NANGO_CONFIG().url,
          nangoSecretKey: NANGO_CONFIG().secretKey,
        },
        tenantId,
      }

      const newMembers = await service.processSyncRemote(membersToCreate, membersToUpdate, context)

      for (const newMember of newMembers) {
        await this.memberRepo.setIntegrationSourceId(
          newMember.memberId,
          integration.platform as PlatformType,
          newMember.sourceId,
        )
        await this.searchSyncEmitter.triggerMemberSync(tenantId, newMember.memberId)
      }
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

    // find all members that has attributes.syncRemote.[integration.platform] = true
    const query = {
      bool: {
        must: [
          {
            term: {
              [`uuid_tenantId`]: tenantId,
            },
          },
          {
            term: {
              [`obj_attributes.obj_syncRemote.bool_${integration.platform}`]: true,
            },
          },
        ],
      },
    } as any

    if (isMultiSegment) {
      query.must.push({
        term: {
          uuid_segmentId: integration.segmentId,
        },
      })
    }

    let markedMembers
    let searchAfter

    do {
      const membersToCreate: IMember[] = []
      const membersToUpdate: IMember[] = []
      searchAfter = markedMembers
        ? markedMembers[markedMembers.length - 1]._source[`uuid_memberId`]
        : undefined

      markedMembers = (await this.openSearchService.search(
        OpenSearchIndex.MEMBERS,
        query,
        undefined,
        batchSize,
        [
          {
            [`uuid_memberId`]: 'desc',
          },
        ],
        searchAfter,
      )) as ISearchHit<any>[]

      const translatedMembers: IMember[] = markedMembers.reduce((acc, member) => {
        const membersWithCrowdFields = translator.translateObjectToCrowd(member._source)
        acc.push(membersWithCrowdFields)
        return acc
      }, [])

      while (translatedMembers.length > 0) {
        const memberToSync = translatedMembers.shift()

        this.log.trace(`Syncing member ${memberToSync.id} to ${integration.platform} remote!`)

        const memberFromDb = await this.memberRepo.findMemberAttributes(memberToSync.id)

        // if sourceId doesn't exist in opensearch, but exists in db, use the sourceId in db and sync to opensearch again
        if (
          !memberToSync.attributes?.sourceId?.[integration.platform] &&
          memberFromDb.attributes?.sourceId?.[integration.platform]
        ) {
          this.log.warn(
            `${integration.platform} sourceId found in db but not in opensearch - using db value and sending trigger member sync to search-sync-worker!`,
          )
          if (memberToSync.attributes?.sourceId) {
            memberToSync.attributes.sourceId[integration.platform] =
              memberFromDb.attributes.sourceId[integration.platform]
          } else {
            memberToSync.attributes.sourceId = {
              [integration.platform]: memberFromDb.attributes?.sourceId?.[integration.platform],
            }
          }

          await this.searchSyncEmitter.triggerMemberSync(tenantId, memberFromDb.id)
        }

        if (memberToSync.attributes?.sourceId?.[integration.platform]) {
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
          memberAttributes: attributes,
          platforms: platforms.map((p) => ({ platform: p, username: null })),
          serviceSettings: {
            nangoId: `${tenantId}-${integration.platform}`,
            nangoUrl: NANGO_CONFIG().url,
            nangoSecretKey: NANGO_CONFIG().secretKey,
          },
          tenantId,
        }

        const newMembers = await service.processSyncRemote(
          membersToCreate,
          membersToUpdate,
          context,
        )

        for (const newMember of newMembers) {
          await this.memberRepo.setIntegrationSourceId(
            newMember.memberId,
            integration.platform as PlatformType,
            newMember.sourceId,
          )

          await this.searchSyncEmitter.triggerMemberSync(tenantId, newMember.memberId)
        }
      } else {
        this.log.warn(`Integration ${integration.platform} has no processSyncRemote function!`)
      }
    } while (markedMembers.length > 0)
  }
}
