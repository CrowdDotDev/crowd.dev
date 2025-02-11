import { proxyActivities } from '@temporalio/workflow'

import { updateActivities } from '@crowd/data-access-layer/src/activities/update'
import { DbStore } from '@crowd/data-access-layer/src/database'
import { DbConnOrTx } from '@crowd/data-access-layer/src/database'
import { IDbActivityCreateData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import {
  figureOutNewOrgId,
  prepareMemberAffiliationsUpdate,
} from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IQueue } from '@crowd/queue'
import {
  IMemberIdentity,
  MemberIdentityType,
  MergeActionState,
  MergeActionStep,
} from '@crowd/types'

import * as activities from '../activities'
import { svc } from '../main'

const {
  deleteMember,
  deleteOrganization,
  moveActivitiesBetweenOrgs,
  notifyFrontendOrganizationMergeSuccessful,
  notifyFrontendOrganizationUnmergeSuccessful,
  recalculateActivityAffiliationsOfMemberAsync,
  recalculateActivityAffiliationsOfOrganizationSynchronous,
  setMergeAction,
  syncMember,
  syncOrganization,
  notifyFrontendMemberMergeSuccessful,
  notifyFrontendMemberUnmergeSuccessful,
  syncRemoveMember,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 minutes',
})

async function finishMemberMergingUpdateActivities(
  pgDb: DbStore,
  qDb: DbConnOrTx,
  queueClient: IQueue,
  memberId: string,
  newMemberId: string,
) {
  const qx = pgpQx(pgDb.connection())
  const { orgCases } = await prepareMemberAffiliationsUpdate(qx, memberId)

  await updateActivities(
    qDb,
    queueClient,
    [
      async () => ({ memberId: newMemberId }),
      async (activity) => ({ organizationId: figureOutNewOrgId(activity, orgCases) }),
    ],
    `"memberId" = $(memberId)`,
    {
      memberId,
    },
  )
}

export async function finishMemberMerging(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  await setMergeAction(primaryId, secondaryId, tenantId, {
    step: MergeActionStep.MERGE_ASYNC_STARTED,
  })

  await finishMemberMergingUpdateActivities(
    svc.postgres.reader,
    svc.questdbSQL,
    svc.queue,
    primaryId,
    secondaryId,
  )

  await syncMember(primaryId)
  await syncRemoveMember(secondaryId)
  await deleteMember(secondaryId)
  await setMergeAction(primaryId, secondaryId, tenantId, {
    state: 'merged' as MergeActionState,
    step: MergeActionStep.MERGE_DONE,
  })
  await notifyFrontendMemberMergeSuccessful(
    primaryId,
    secondaryId,
    primaryDisplayName,
    secondaryDisplayName,
    tenantId,
    userId,
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
  pgDb,
  qDb,
  queueClient,
  memberId,
  newMemberId,
  identities,
}: {
  pgDb: DbStore
  qDb: DbConnOrTx
  queueClient: IQueue
  memberId: string
  newMemberId: string
  identities: IMemberIdentity[]
}) {
  const qx = pgpQx(pgDb.connection())
  const { orgCases } = await prepareMemberAffiliationsUpdate(qx, memberId)

  await updateActivities(
    qDb,
    queueClient,
    [
      async (activity) => moveByIdentities({ activity, identities, newMemberId }),
      async (activity) => ({
        organizationId: figureOutNewOrgId(activity, orgCases),
      }),
    ],
    `"memberId" = $(memberId)`,
    { memberId },
  )
}

export async function finishMemberUnmerging(
  primaryId: string,
  secondaryId: string,
  identities: IMemberIdentity[],
  primaryDisplayName: string,
  secondaryDisplayName: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  await setMergeAction(primaryId, secondaryId, tenantId, {
    step: MergeActionStep.UNMERGE_ASYNC_STARTED,
  })

  await finishMemberUnmergingUpdateActivities({
    pgDb: svc.postgres.reader,
    qDb: svc.questdbSQL,
    queueClient: svc.queue,
    memberId: primaryId,
    newMemberId: secondaryId,
    identities,
  })
  await syncMember(primaryId)
  await syncMember(secondaryId)
  await recalculateActivityAffiliationsOfMemberAsync(primaryId, tenantId)
  await recalculateActivityAffiliationsOfMemberAsync(secondaryId, tenantId)
  await setMergeAction(primaryId, secondaryId, tenantId, {
    state: 'unmerged' as MergeActionState,
    step: MergeActionStep.UNMERGE_DONE,
  })
  await notifyFrontendMemberUnmergeSuccessful(
    primaryId,
    secondaryId,
    primaryDisplayName,
    secondaryDisplayName,
    tenantId,
    userId,
  )
}

export async function finishOrganizationMerging(
  primaryId: string,
  secondaryId: string,
  original: string,
  toMerge: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  await setMergeAction(primaryId, secondaryId, tenantId, {
    step: MergeActionStep.MERGE_ASYNC_STARTED,
  })

  await moveActivitiesBetweenOrgs(primaryId, secondaryId, tenantId)

  const syncStart = new Date()
  await syncOrganization(primaryId, syncStart)
  await deleteOrganization(secondaryId)
  await setMergeAction(primaryId, secondaryId, tenantId, {
    state: 'merged' as MergeActionState,
    step: MergeActionStep.MERGE_DONE,
  })
  await notifyFrontendOrganizationMergeSuccessful(
    primaryId,
    secondaryId,
    original,
    toMerge,
    tenantId,
    userId,
  )
}

export async function finishOrganizationUnmerging(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  await setMergeAction(primaryId, secondaryId, tenantId, {
    step: MergeActionStep.UNMERGE_ASYNC_STARTED,
  })
  await recalculateActivityAffiliationsOfOrganizationSynchronous(primaryId, tenantId)
  await recalculateActivityAffiliationsOfOrganizationSynchronous(secondaryId, tenantId)
  const syncStart = new Date()
  await syncOrganization(primaryId, syncStart)
  await syncOrganization(secondaryId, syncStart)
  await setMergeAction(primaryId, secondaryId, tenantId, {
    state: 'unmerged' as MergeActionState,
    step: MergeActionStep.UNMERGE_DONE,
  })
  await notifyFrontendOrganizationUnmergeSuccessful(
    primaryId,
    secondaryId,
    primaryDisplayName,
    secondaryDisplayName,
    tenantId,
    userId,
  )
}
