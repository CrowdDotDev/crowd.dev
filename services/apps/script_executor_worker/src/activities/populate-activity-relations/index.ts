import { getDefaultTenantId } from '@crowd/common'
import { createOrUpdateRelations, getActivitiesSortedById } from '@crowd/data-access-layer'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IndexedEntityType, IndexingRepository } from '@crowd/opensearch'

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

export async function markActivitiesAsIndexed(activityIds: string[]): Promise<void> {
  const indexingRepo = new IndexingRepository(svc.postgres.writer, svc.log)
  await indexingRepo.markEntitiesIndexed(
    IndexedEntityType.ACTIVITY,
    activityIds.map((id) => ({ id, tenantId })),
  )
}

export async function getActivitiesToCopy(latestSyncedActivityId: string, limit: number) {
  const activities = await getActivitiesSortedById(svc.questdbSQL, latestSyncedActivityId, limit)
  return activities
}

export async function createRelations(activities): Promise<void> {
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
