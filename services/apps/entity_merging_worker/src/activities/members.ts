import { WorkflowIdReusePolicy } from '@temporalio/workflow'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import {
  getMemberActivityTimestampRanges,
  updateActivities,
} from '@crowd/data-access-layer/src/activities/update'
import { cleanupMemberAggregates } from '@crowd/data-access-layer/src/members/segments'
import { IDbActivityCreateData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import {
  cleanupMember,
  deleteMemberSegments,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'
import { figureOutNewOrgId } from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import { prepareMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import { dbStoreQx, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
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

  await syncApi.triggerMemberSync(memberId, { withAggs: true })
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

export async function finishMemberMergingUpdateActivities(memberId: string, newMemberId: string) {
  const pgDb = svc.postgres.reader
  const qDb = svc.questdbSQL
  const queueClient = svc.queue

  const qx = pgpQx(pgDb.connection())
  const { orgCases, fallbackOrganizationId } = await prepareMemberAffiliationsUpdate(qx, memberId)

  const { minTimestamp, maxTimestamp } = await getMemberActivityTimestampRanges(qDb, memberId)

  await updateActivities(
    qDb,
    pgpQx(svc.postgres.writer.connection()),
    queueClient,
    [
      async () => ({ memberId: newMemberId }),
      async (activity) => ({
        organizationId: figureOutNewOrgId(activity, orgCases, fallbackOrganizationId),
      }),
    ],
    `"memberId" = $(memberId) 
    ${minTimestamp ? 'AND "timestamp" >= $(minTimestamp)' : ''} 
    ${maxTimestamp ? 'AND "timestamp" <= $(maxTimestamp)' : ''}`,
    {
      memberId,
      ...(minTimestamp && { minTimestamp }),
      ...(maxTimestamp && { maxTimestamp }),
    },
  )
}

function moveByIdentities({
  activity,
  identities,
  newMemberId,
}: {
  activity: IDbActivityCreateData
  identities: IMemberIdentity[]
  newMemberId: string
}): Partial<IDbActivityCreateData> {
  const { platform, username } = activity
  const activityMatches = identities.some(
    (i) =>
      i.type === MemberIdentityType.USERNAME && i.platform === platform && i.value === username,
  )

  return activityMatches ? { memberId: newMemberId } : {}
}

export async function finishMemberUnmergingUpdateActivities({
  memberId,
  newMemberId,
  identities,
}: {
  memberId: string
  newMemberId: string
  identities: IMemberIdentity[]
}) {
  const pgDb = svc.postgres.reader
  const qDb = svc.questdbSQL
  const queueClient = svc.queue

  const qx = pgpQx(pgDb.connection())
  const { orgCases, fallbackOrganizationId } = await prepareMemberAffiliationsUpdate(qx, memberId)

  const { minTimestamp, maxTimestamp } = await getMemberActivityTimestampRanges(qDb, memberId)

  await updateActivities(
    qDb,
    pgpQx(svc.postgres.writer.connection()),
    queueClient,
    [
      async (activity) => moveByIdentities({ activity, identities, newMemberId }),
      async (activity) => ({
        organizationId: figureOutNewOrgId(activity, orgCases, fallbackOrganizationId),
      }),
    ],
    `"memberId" = $(memberId) 
    ${minTimestamp ? 'AND "timestamp" >= $(minTimestamp)' : ''} 
    ${maxTimestamp ? 'AND "timestamp" <= $(maxTimestamp)' : ''}`,
    { memberId, ...(minTimestamp && { minTimestamp }), ...(maxTimestamp && { maxTimestamp }) },
  )
}
