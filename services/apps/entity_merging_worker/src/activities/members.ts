import { WorkflowIdReusePolicy } from '@temporalio/workflow'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import { cleanupMemberAggregates } from '@crowd/data-access-layer/src/members/segments'
import {
  cleanupMember,
  deleteMemberSegments,
  findMemberById,
  getIdentitiesWithActivity,
  moveActivitiesToNewMember,
  moveIdentityActivitiesToNewMember,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { RedisPubSubEmitter } from '@crowd/redis'
import {
  ApiWebsocketMessage,
  IMemberIdentity,
  MemberIdentityType,
  TemporalWorkflowId,
} from '@crowd/types'

import { svc } from '../main'

export async function deleteMember(memberId: string): Promise<void> {
  await deleteMemberSegments(svc.postgres.writer, memberId)
  const qx = dbStoreQx(svc.postgres.writer)
  await cleanupMemberAggregates(qx, memberId)
  await cleanupMember(svc.postgres.writer, memberId)
}

export async function moveActivitiesBetweenMembers(
  primaryId: string,
  secondaryId: string,
): Promise<void> {
  const memberExists = await findMemberById(svc.postgres.writer, primaryId)

  if (!memberExists) {
    return
  }
  await moveActivitiesToNewMember(svc.questdbSQL, primaryId, secondaryId)
}

export async function moveActivitiesWithIdentityToAnotherMember(
  fromId: string,
  toId: string,
  identities: IMemberIdentity[],
): Promise<void> {
  const memberExists = await findMemberById(svc.postgres.writer, toId)

  if (!memberExists) {
    return
  }

  const identitiesWithActivity = await getIdentitiesWithActivity(
    svc.postgres.writer,
    fromId,
    identities,
  )

  for (const identity of identities.filter(
    (i) =>
      i.type === MemberIdentityType.USERNAME &&
      identitiesWithActivity.some((ai) => ai.platform === i.platform && ai.username === i.value),
  )) {
    await moveIdentityActivitiesToNewMember(
      svc.questdbSQL,
      fromId,
      toId,
      identity.value,
      identity.platform,
    )
  }
}

export async function recalculateActivityAffiliationsOfMemberAsync(
  memberId: string,
): Promise<void> {
  await svc.temporal.workflow.start('memberUpdate', {
    taskQueue: 'profiles',
    workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${memberId}`,
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
  })
}

export async function syncMember(memberId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerMemberSync(memberId)
}

export async function syncRemoveMember(memberId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })
  await syncApi.triggerRemoveMember(memberId)
}

export async function notifyFrontendMemberMergeSuccessful(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
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
      'member-merge',
      JSON.stringify({
        success: true,
        tenantId: DEFAULT_TENANT_ID,
        userId,
        primaryId,
        secondaryId,
        primaryDisplayName,
        secondaryDisplayName,
      }),
      undefined,
      DEFAULT_TENANT_ID,
    ),
  )
}

export async function notifyFrontendMemberUnmergeSuccessful(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
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
        tenantId: DEFAULT_TENANT_ID,
        userId,
        primaryId,
        secondaryId,
        primaryDisplayName,
        secondaryDisplayName,
      }),
      undefined,
      DEFAULT_TENANT_ID,
    ),
  )
}
