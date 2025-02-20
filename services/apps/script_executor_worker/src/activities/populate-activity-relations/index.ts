import { getDefaultTenantId } from '@crowd/common'
import {
  createOrUpdateRelations,
  getActivityCreatedAtById,
  getActivityRelationsSortedByCreatedAt,
} from '@crowd/data-access-layer'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IndexedEntityType, IndexingRepository } from '@crowd/opensearch'
import { RedisCache } from '@crowd/redis'

import { svc } from '../../main'

const tenantId = getDefaultTenantId()

export async function deleteActivityIdsFromIndexedEntities(): Promise<void> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  await indexingRepo.deleteIndexedEntities(IndexedEntityType.ACTIVITY)
}

export async function getLatestSyncedActivityId(): Promise<string> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  return await indexingRepo.getLatestIndexedEntityId(IndexedEntityType.ACTIVITY)
}

export async function markActivitiesAsIndexed(activitiesRedisKey: string): Promise<string> {
  const activities = await getCache(activitiesRedisKey)
  const activityIds = activities.map((activity) => activity.id)
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  await indexingRepo.markEntitiesIndexed(
    IndexedEntityType.ACTIVITY,
    activityIds.map((id) => ({ id, tenantId })),
  )
  return activityIds[activityIds.length - 1]
}

export async function getActivitiesToCopy(latestSyncedActivityId: string, limit: number) {
  let latestSyncedActivityCreatedAt = undefined
  if (latestSyncedActivityId) {
    latestSyncedActivityCreatedAt = await getActivityCreatedAtById(
      svc.questdbSQL,
      latestSyncedActivityId,
    )
  }

  const activities = await getActivityRelationsSortedByCreatedAt(
    svc.questdbSQL,
    latestSyncedActivityCreatedAt ? latestSyncedActivityCreatedAt.createdAt : undefined,
    limit,
  )

  if (activities.length === 0) {
    return null
  }

  // generate a random key
  const key = Math.random().toString(36).substring(7)
  await saveToCache(key, activities)

  return { activitiesRedisKey: key, activitiesLength: activities.length }
}

export async function createRelations(activitiesRedisKey): Promise<void> {
  const activities = await getCache(activitiesRedisKey)
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

export async function saveToCache(key: string, activities): Promise<void> {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  await redisCache.set(key, JSON.stringify(activities), 30)
}

export async function getCache(key: string) {
  const redisCache = new RedisCache(`activity-relations-data`, svc.redis, svc.log)
  const result = await redisCache.get(key)
  return JSON.parse(result)
}
