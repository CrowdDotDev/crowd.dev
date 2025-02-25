import {
  createOrUpdateRelations,
  getActivityRelationsSortedByCreatedAt,
} from '@crowd/data-access-layer'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { RedisCache } from '@crowd/redis'

import { svc } from '../../main'

const LAST_SYNCED_ACTIVITY_CREATED_AT_REDIS_KEY = 'latest-synced-activity-created-at'
const LAST_SYNCED_ACTIVITY_TIMESTAMP_REDIS_KEY = 'last-synced-activity-timestamp'

const REDIS_KEY = LAST_SYNCED_ACTIVITY_TIMESTAMP_REDIS_KEY


export async function resetIndexedIdentities(): Promise<void> {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  await redisCache.delete(REDIS_KEY)
}

export async function getLatestSyncedActivityCreatedAt(): Promise<string> {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  const result = await redisCache.get(REDIS_KEY)
  return result || null
}

export async function markActivitiesAsIndexed(activitiesRedisKey: string): Promise<string> {
  const activities = await getActivitiyDataFromRedis(activitiesRedisKey)
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  const lastSyncedCreatedAt = activities[activities.length - 1].timestamp
  await redisCache.set(REDIS_KEY, lastSyncedCreatedAt)
  return lastSyncedCreatedAt
}

export async function getActivitiesToCopy(latestSyncedActivityCreatedAt: string, limit: number) {
  const activities = await getActivityRelationsSortedByCreatedAt(
    svc.questdbSQL,
    latestSyncedActivityCreatedAt,
    limit,
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
    lastCreatedAt: activities[activities.length - 1].createdAt,
  }
}

export async function createRelations(activitiesRedisKey): Promise<void> {
  const activities = await getActivitiyDataFromRedis(activitiesRedisKey)
  const promises = activities.map(async (activity) =>
    createOrUpdateRelations(pgpQx(svc.postgres.writer.connection()), {
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
    }),
  )

  await Promise.all(promises)
}

export async function saveActivityDataToRedis(key: string, activities): Promise<void> {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  await redisCache.set(key, JSON.stringify(activities), 90)
}

export async function getActivitiyDataFromRedis(key: string) {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  const result = await redisCache.get(key)
  return JSON.parse(result)
}
