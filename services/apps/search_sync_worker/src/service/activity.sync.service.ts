import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, logExecutionTime } from '@crowd/logging'
import { OpenSearchService } from './opensearch.service'
import { ActivityRepository } from '@/repo/activity.repo'
import { OpenSearchIndex } from '@/types'
import { timeout } from '@crowd/common'
import { IDbActivitySyncData } from '@/repo/activity.data'
import { ISearchHit } from './opensearch.data'

export class ActivitySyncService extends LoggerBase {
  private readonly activityRepo: ActivityRepository

  constructor(
    store: DbStore,
    private readonly openSearchService: OpenSearchService,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.activityRepo = new ActivityRepository(store, this.log)
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

    let results: ISearchHit<{ date_timestamp: string }>[] = await this.openSearchService.search(
      OpenSearchIndex.ACTIVITIES,
      query,
      pageSize,
      sort,
      undefined,
      include,
    )

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
      results = await this.openSearchService.search(
        OpenSearchIndex.ACTIVITIES,
        query,
        pageSize,
        sort,
        lastTimestamp,
        include,
      )
    }

    this.log.warn(
      { tenantId },
      `'Processed total of ${processed} members while cleaning up tenant!'`,
    )
  }

  public async syncTenantActivities(
    tenantId: string,
    reset = true,
    batchSize = 500,
  ): Promise<void> {
    this.log.warn({ tenantId }, 'Syncing all tenant activities!')
    let count = 0

    await logExecutionTime(
      async () => {
        if (reset) {
          await this.activityRepo.setTenanActivitiesForSync(tenantId)
        }

        let activityIds = await this.activityRepo.getTenantActivitiesForSync(tenantId, 1, batchSize)

        while (activityIds.length > 0) {
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
            count += activities.length
          }

          await this.activityRepo.markSynced(activities.map((m) => m.id))

          this.log.info({ tenantId }, `Synced ${count} activities!`)
          activityIds = await this.activityRepo.getTenantActivitiesForSync(tenantId, 1, batchSize)
        }
      },
      this.log,
      'sync-tenant-activities',
    )

    this.log.info({ tenantId }, `Synced total of ${count} activities!`)
  }

  public async removeActivity(activityId: string): Promise<void> {
    this.log.debug({ activityId }, 'Removing activity from index!')
    await this.openSearchService.removeFromIndex(activityId, OpenSearchIndex.ACTIVITIES)
  }

  public async syncActivity(activityId: string, retries = 0): Promise<void> {
    this.log.debug({ activityId }, 'Syncing activity!')

    const activities = await this.activityRepo.getActivityData([activityId])

    if (activities.length > 0) {
      if (activities.length > 1) {
        this.log.error({ activityId }, 'More than one activity found!')
        throw new Error(`More than one activity found for id ${activityId}!`)
      }

      const activity = activities[0]

      const prepared = ActivitySyncService.prefixData(activity)
      await this.openSearchService.index(activityId, OpenSearchIndex.ACTIVITIES, prepared)
    } else {
      // we should retry - sometimes database is slow
      if (retries < 5) {
        await timeout(100)
        await this.syncActivity(activityId, ++retries)
      } else {
        this.log.error({ activityId }, 'Activity not found after 5 retries! Removing from index!')
        await this.openSearchService.removeFromIndex(activityId, OpenSearchIndex.ACTIVITIES)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static prefixData(data: IDbActivitySyncData): any {
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
    p.string_attributes = data.attributes ? JSON.stringify(data.attributes) : '{}'
    p.keyword_channel = data.channel
    p.string_body = data.body
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

    return p
  }
}
