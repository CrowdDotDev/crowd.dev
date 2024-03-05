import { IDbActivitySyncData } from '../repo/activity.data'
import { ActivityRepository } from '../repo/activity.repo'
import { OpenSearchIndex } from '../types'
import { trimUtf8ToMaxByteLength } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { Logger, getChildLogger, logExecutionTime } from '@crowd/logging'
import { IPagedSearchResponse, ISearchHit } from './opensearch.data'
import { OpenSearchService } from './opensearch.service'
import { IndexingRepository } from '../repo/indexing.repo'
import { IndexedEntityType } from '../repo/indexing.data'

export class ActivitySyncService {
  private static MAX_BYTE_LENGTH = 25000
  private log: Logger
  private readonly activityRepo: ActivityRepository
  private readonly indexingRepo: IndexingRepository

  constructor(
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    this.log = getChildLogger('activity-sync-service', parentLog)

    this.activityRepo = new ActivityRepository(store, this.log)
    this.indexingRepo = new IndexingRepository(store, this.log)
  }

  public async getAllIndexedTenantIds(
    pageSize = 500,
    afterKey?: string,
  ): Promise<IPagedSearchResponse<string, string>> {
    const include = ['uuid_tenantId']

    const results = await this.openSearchService.search(
      OpenSearchIndex.ACTIVITIES,
      undefined,
      {
        uuid_tenantId_buckets: {
          composite: {
            size: pageSize,
            sources: [
              {
                uuid_tenantId: {
                  terms: {
                    field: 'uuid_tenantId',
                  },
                },
              },
            ],
            after: afterKey
              ? {
                  uuid_tenantId: afterKey,
                }
              : undefined,
          },
        },
      },
      undefined,
      undefined,
      undefined,
      include,
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (results as any).uuid_tenantId_buckets

    const newAfterKey = data.after_key?.uuid_tenantId

    const ids = data.buckets.map((b) => b.key.uuid_tenantId)

    return {
      data: ids,
      afterKey: newAfterKey,
    }
  }

  public async cleanupActivityIndex(tenantId: string): Promise<void> {
    this.log.warn({ tenantId }, 'Cleaning up activity index!')

    const query = {
      bool: {
        filter: {
          term: {
            uuid_tenantId: tenantId,
          },
        },
      },
    }

    const sort = [{ date_timestamp: 'asc' }]
    const include = ['date_timestamp']
    const pageSize = 500
    let lastTimestamp: string

    let results = (await this.openSearchService.search(
      OpenSearchIndex.ACTIVITIES,
      query,
      undefined,
      pageSize,
      sort,
      undefined,
      include,
    )) as ISearchHit<{ date_timestamp: string }>[]

    let processed = 0

    while (results.length > 0) {
      // check every activity if they exists in the database and if not remove them from the index
      const ids = results.map((r) => r._id)
      const dbIds = await this.activityRepo.checkActivitiesExist(tenantId, ids)

      const toRemove = ids.filter((id) => !dbIds.includes(id))

      if (toRemove.length > 0) {
        this.log.warn({ tenantId, toRemove }, 'Removing activities from index!')
        for (const id of toRemove) {
          await this.removeActivity(id)
        }
      }

      processed += results.length
      this.log.warn({ tenantId }, `Processed ${processed} activities while cleaning up tenant!`)

      // use last joinedAt to get the next page
      lastTimestamp = results[results.length - 1]._source.date_timestamp
      results = (await this.openSearchService.search(
        OpenSearchIndex.ACTIVITIES,
        query,
        undefined,
        pageSize,
        sort,
        lastTimestamp,
        include,
      )) as ISearchHit<{ date_timestamp: string }>[]
    }

    this.log.warn({ tenantId }, `Processed total of ${processed} members while cleaning up tenant!`)
  }

  public async syncTenantActivities(tenantId: string, batchSize = 200): Promise<void> {
    this.log.debug({ tenantId }, 'Syncing all tenant activities!')
    let count = 0
    const now = new Date()

    await logExecutionTime(
      async () => {
        let activityIds = await this.activityRepo.getTenantActivitiesForSync(tenantId, batchSize)

        while (activityIds.length > 0) {
          count += await this.syncActivities(activityIds)

          const diffInSeconds = (new Date().getTime() - now.getTime()) / 1000
          this.log.info(
            { tenantId },
            `Synced ${count} activities! Speed: ${Math.round(
              count / diffInSeconds,
            )} activities/second!`,
          )

          await this.indexingRepo.markEntitiesIndexed(
            IndexedEntityType.ACTIVITY,
            activityIds.map((id) => {
              return {
                id,
                tenantId,
              }
            }),
          )

          activityIds = await this.activityRepo.getTenantActivitiesForSync(tenantId, batchSize)
        }
      },
      this.log,
      'sync-tenant-activities',
    )

    this.log.info({ tenantId }, `Synced total of ${count} activities!`)
  }

  public async syncOrganizationActivities(organizationId: string, batchSize = 200): Promise<void> {
    this.log.debug({ organizationId }, 'Syncing all organization activities!')
    let count = 0
    const now = new Date()

    await logExecutionTime(
      async () => {
        let activityIds = await this.activityRepo.getOrganizationActivitiesForSync(
          organizationId,
          batchSize,
        )

        while (activityIds.length > 0) {
          count += await this.syncActivities(activityIds)

          const diffInSeconds = (new Date().getTime() - now.getTime()) / 1000
          this.log.info(
            { organizationId },
            `Synced ${count} activities! Speed: ${Math.round(
              count / diffInSeconds,
            )} activities/second!`,
          )

          activityIds = await this.activityRepo.getOrganizationActivitiesForSync(
            organizationId,
            batchSize,
            activityIds[activityIds.length - 1],
          )
        }
      },
      this.log,
      'sync-organization-activities',
    )

    this.log.info({ organizationId }, `Synced total of ${count} activities!`)
  }

  public async removeActivity(activityId: string): Promise<void> {
    this.log.debug({ activityId }, 'Removing activity from index!')
    await this.openSearchService.removeFromIndex(activityId, OpenSearchIndex.ACTIVITIES)
  }

  public async syncActivities(activityIds: string[]): Promise<number> {
    this.log.debug({ activityIds }, 'Syncing activities!')

    const activities = await this.activityRepo.getActivityData(activityIds)

    if (activities.length > 0) {
      await this.openSearchService.bulkIndex(
        OpenSearchIndex.ACTIVITIES,
        activities.map((m) => {
          return {
            id: m.id,
            body: ActivitySyncService.prefixData(m),
          }
        }),
      )
    }

    return activities.length
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static prefixData(data: IDbActivitySyncData): any {
    const p: Record<string, unknown> = {}

    p.uuid_id = data.id
    p.uuid_tenantId = data.tenantId
    p.uuid_segmentId = data.segmentId
    p.keyword_type = data.type
    p.date_timestamp = new Date(data.timestamp).toISOString()
    p.keyword_platform = data.platform
    p.bool_isContribution = data.isContribution
    p.int_score = data.score ?? 0
    p.keyword_sourceId = data.sourceId
    p.keyword_sourceParentId = data.sourceParentId
    p.keyword_channel = data.channel
    p.string_body = trimUtf8ToMaxByteLength(data.body, ActivitySyncService.MAX_BYTE_LENGTH)
    p.string_title = data.title
    p.string_url = data.url
    p.int_sentiment = data.sentiment
    p.keyword_importHash = data.importHash
    p.uuid_memberId = data.memberId
    p.uuid_conversationId = data.conversationId
    p.uuid_parentId = data.parentId
    p.string_username = data.username
    p.uuid_objectMemberId = data.objectMemberId
    p.string_objectMemberUsername = data.objectMemberUsername
    p.uuid_organizationId = data.organizationId

    return p
  }
}
