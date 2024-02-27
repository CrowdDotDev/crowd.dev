import { ApiWebsocketMessage, IMemberIdentity, TemporalWorkflowId } from '@crowd/types'
import { svc } from '../main'
import { WorkflowIdReusePolicy } from '@temporalio/workflow'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { RedisPubSubEmitter } from '@crowd/redis'

import {
  deleteMemberSegments,
  cleanupMember,
  findMemberById,
  moveActivitiesToNewMember,
  moveIdentityActivitiesToNewMember,
  findMemberSegments,
  markMemberAsManuallyCreated,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'

export async function deleteMember(memberId: string): Promise<void> {
  await deleteMemberSegments(svc.postgres.writer, memberId)
  await cleanupMember(svc.postgres.writer, memberId)
}

export async function moveActivitiesBetweenMembers(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<void> {
  const memberExists = await findMemberById(svc.postgres.writer, primaryId, tenantId)

  if (!memberExists) {
    return
  }
  await moveActivitiesToNewMember(svc.postgres.writer, primaryId, secondaryId, tenantId)
}

export async function moveActivitiesWithIdentityToAnotherMember(
  fromId: string,
  toId: string,
  identities: IMemberIdentity[],
  tenantId: string,
): Promise<void> {
  const memberExists = await findMemberById(svc.postgres.writer, toId, tenantId)

  if (!memberExists) {
    return
  }

  for (const identity of identities) {
    await moveIdentityActivitiesToNewMember(
      svc.postgres.writer,
      tenantId,
      fromId,
      toId,
      identity.username,
      identity.platform,
    )
  }
}

export async function recalculateActivityAffiliations(
  memberId: string,
  tenantId: string,
): Promise<void> {
  await svc.temporal.workflow.start('memberUpdate', {
    taskQueue: 'profiles',
    workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${tenantId}/${memberId}`,
    workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    retry: {
      maximumAttempts: 10,
    },
    args: [
      {
        member: {
          id: memberId,
        },
      },
    ],
    searchAttributes: {
      TenantId: [tenantId],
    },
  })
}

export async function syncMember(memberId: string, secondaryMemberId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  // check if member has any activities
  const result = await findMemberSegments(svc.postgres.writer, memberId)

  if (result.segmentIds) {
    // segment information can be deduced from activities, no need to send segmentIds explicitly on merging
    await syncApi.triggerMemberSync(memberId)
    return
  }

  // check if secondary member has any activities
  const secondaryResult = await findMemberSegments(svc.postgres.writer, secondaryMemberId)

  if (secondaryResult.segmentIds) {
    // mark member as manually created
    await markMemberAsManuallyCreated(svc.postgres.writer, memberId)
    // member doesn't have any activity to deduce segmentIds for syncing, use the secondary member's activity segments
    await syncApi.triggerMemberSync(memberId, secondaryResult.segmentIds)
  }
}

export async function notifyFrontendMemberUnmergeSuccessful(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  const emitter = new RedisPubSubEmitter(
    'api-pubsub',
    svc.redis,
    (err) => {
      svc.log.error({ err }, 'Error in api-ws emitter!')
    },
    svc.log,
  )

  emitter.emit(
    'user',
    new ApiWebsocketMessage(
      'member-unmerge',
      JSON.stringify({
        success: true,
        tenantId,
        userId,
        primaryId,
        secondaryId,
        primaryDisplayName,
        secondaryDisplayName,
      }),
      undefined,
      tenantId,
    ),
  )
}
