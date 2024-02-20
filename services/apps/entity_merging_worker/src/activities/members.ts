import { ApiWebsocketMessage, IMemberIdentity, TemporalWorkflowId } from '@crowd/types'
import { svc } from '../main'
import { WorkflowIdReusePolicy } from '@temporalio/workflow'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { RedisPubSubEmitter } from '@crowd/redis'

export async function deleteMember(memberId: string): Promise<void> {
  await svc.postgres.writer.connection().query(
    `
      DELETE FROM "memberSegments"
      WHERE "memberId" = $1
    `,
    [memberId],
  )
  await svc.postgres.writer.connection().query(
    `
      DELETE FROM members
      WHERE id = $1
    `,
    [memberId],
  )
}

export async function moveActivitiesBetweenMembers(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<void> {
  const memberExists = await svc.postgres.writer.connection().oneOrNone(
    `
      SELECT id
      FROM members
      WHERE id = $1
        AND "tenantId" = $2
    `,
    [primaryId, tenantId],
  )

  if (!memberExists) {
    return
  }

  await svc.postgres.writer.connection().query(
    `
      UPDATE activities
      SET "memberId" = $1
      WHERE "memberId" = $2
        AND "tenantId" = $3;
    `,
    [primaryId, secondaryId, tenantId],
  )
}

export async function moveActivitiesWithIdentityToAnotherMember(
  fromId: string,
  toId: string,
  identities: IMemberIdentity[],
  tenantId: string,
): Promise<void> {
  const memberExists = await svc.postgres.writer.connection().oneOrNone(
    `
      SELECT id
      FROM members
      WHERE id = $1
        AND "tenantId" = $2
    `,
    [toId, tenantId],
  )

  if (!memberExists) {
    return
  }

  for (const identity of identities) {
    await svc.postgres.writer.connection().query(
      `
        UPDATE activities
        SET "memberId" = $1
        WHERE "memberId" = $2
          AND "tenantId" = $3
          AND username = $4
          AND platform = $5;
      `,
      [toId, fromId, tenantId, identity.username, identity.platform],
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

export async function syncMember(memberId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerMemberSync(memberId)
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
