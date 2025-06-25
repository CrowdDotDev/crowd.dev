import { partition } from '@crowd/common'
import {
  IActivityRelationsCreateData,
  createOrUpdateRelations,
  getActivityRelationsSortedByTimestamp,
} from '@crowd/data-access-layer'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { RedisCache } from '@crowd/redis'

import { svc } from '../../main'

export async function resetIndexedIdentities(): Promise<void> {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  await redisCache.delete('last-synced-activity-timestamp')
}

export async function getLatestSyncedActivityTimestamp(): Promise<string> {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  const result = await redisCache.get('last-synced-activity-timestamp')
  return result || null
}

export async function markActivitiesAsIndexed(activitiesRedisKey: string): Promise<string> {
  const activities = await getActivitiyDataFromRedis(activitiesRedisKey)
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  const lastSyncedTimestamp = activities[activities.length - 1].timestamp
  await redisCache.set('last-synced-activity-timestamp', lastSyncedTimestamp)
  return lastSyncedTimestamp
}

export async function getActivitiesToCopy(
  latestSyncedActivityTimestamp: string,
  limit: number,
  segmentIds?: string[],
) {
  const activities = await getActivityRelationsSortedByTimestamp(
    svc.questdbSQL,
    latestSyncedActivityTimestamp,
    limit,
    segmentIds,
  )

  if (activities.length === 0) {
    return null
  }

  // generate a random key
  const key = Math.random().toString(36).substring(7)
  await saveActivityDataToRedis(key, activities)

  return {
    activitiesRedisKey: key,
    activitiesLength: activities.length,
    lastTimestamp: activities[activities.length - 1].timestamp,
  }
}

export async function createRelations(activitiesRedisKey): Promise<void> {
  const activities: IActivityRelationsCreateData[] =
    await getActivitiyDataFromRedis(activitiesRedisKey)

  const chunkSize = 500
  const activityChunks = partition(activities, chunkSize)

  for (const chunk of activityChunks) {
    const payload = chunk.map((activity) => {
      return {
        activityId: activity.id,
        memberId: activity.memberId,
        platform: activity.platform,
        segmentId: activity.segmentId,
        username: activity.username,
        conversationId: activity.conversationId,
        objectMemberId: activity.objectMemberId,
        objectMemberUsername: activity.objectMemberUsername,
        organizationId: activity.organizationId,
        parentId: activity.parentId,
        sourceId: activity.sourceId,
        type: activity.type,
        timestamp: activity.timestamp,
        channel: activity.channel,
        sentimentScore: activity.sentimentScore,
        gitInsertions: activity.gitInsertions,
        gitDeletions: activity.gitDeletions,
        score: activity.score,
        isContribution: activity.isContribution,
        pullRequestReviewState: activity.attributes?.reviewState as string,
      }
    })
    await createOrUpdateRelations(pgpQx(svc.postgres.writer.connection()), payload)
  }
}

export async function saveActivityDataToRedis(key: string, activities): Promise<void> {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  await redisCache.set(key, JSON.stringify(activities), 360)
}

export async function getActivitiyDataFromRedis(key: string) {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  const result = await redisCache.get(key)
  return JSON.parse(result)
}
