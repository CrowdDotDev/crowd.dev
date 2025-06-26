import { proxyActivities } from '@temporalio/workflow'

import { IMemberIdentity, MergeActionState, MergeActionStep } from '@crowd/types'

import * as activities from '../activities'

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
  finishMemberMergingUpdateActivities,
  finishMemberUnmergingUpdateActivities,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 minutes',
})

export async function finishMemberMerging(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
  userId: string,
): Promise<void> {
  await setMergeAction(primaryId, secondaryId, {
    step: MergeActionStep.MERGE_ASYNC_STARTED,
  })

  await finishMemberMergingUpdateActivities(secondaryId, primaryId)

  await syncMember(primaryId)
  await syncRemoveMember(secondaryId)

  await deleteMember(secondaryId)

  await setMergeAction(primaryId, secondaryId, {
    state: 'merged' as MergeActionState,
    step: MergeActionStep.MERGE_DONE,
  })
  await notifyFrontendMemberMergeSuccessful(
    primaryId,
    secondaryId,
    primaryDisplayName,
    secondaryDisplayName,
    userId,
  )
}

export async function finishMemberUnmerging(
  primaryId: string,
  secondaryId: string,
  identities: IMemberIdentity[],
  primaryDisplayName: string,
  secondaryDisplayName: string,
  userId: string,
): Promise<void> {
  await setMergeAction(primaryId, secondaryId, {
    step: MergeActionStep.UNMERGE_ASYNC_STARTED,
  })

  await finishMemberUnmergingUpdateActivities({
    memberId: primaryId,
    newMemberId: secondaryId,
    identities,
  })
  await syncMember(primaryId)
  await syncMember(secondaryId)
  await recalculateActivityAffiliationsOfMemberAsync(primaryId)
  await recalculateActivityAffiliationsOfMemberAsync(secondaryId)
  await setMergeAction(primaryId, secondaryId, {
    state: 'unmerged' as MergeActionState,
    step: MergeActionStep.UNMERGE_DONE,
  })
  await notifyFrontendMemberUnmergeSuccessful(
    primaryId,
    secondaryId,
    primaryDisplayName,
    secondaryDisplayName,
    userId,
  )
}

export async function finishOrganizationMerging(
  primaryId: string,
  secondaryId: string,
  original: string,
  toMerge: string,
  userId: string,
): Promise<void> {
  await setMergeAction(primaryId, secondaryId, {
    step: MergeActionStep.MERGE_ASYNC_STARTED,
  })

  await moveActivitiesBetweenOrgs(primaryId, secondaryId)

  const syncStart = new Date()
  await syncOrganization(primaryId, syncStart)
  await deleteOrganization(secondaryId)
  await setMergeAction(primaryId, secondaryId, {
    state: 'merged' as MergeActionState,
    step: MergeActionStep.MERGE_DONE,
  })
  await notifyFrontendOrganizationMergeSuccessful(primaryId, secondaryId, original, toMerge, userId)
}

export async function finishOrganizationUnmerging(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
  userId: string,
): Promise<void> {
  await setMergeAction(primaryId, secondaryId, {
    step: MergeActionStep.UNMERGE_ASYNC_STARTED,
  })
  await recalculateActivityAffiliationsOfOrganizationSynchronous(primaryId)
  await recalculateActivityAffiliationsOfOrganizationSynchronous(secondaryId)
  const syncStart = new Date()
  await syncOrganization(primaryId, syncStart)
  await syncOrganization(secondaryId, syncStart)
  await setMergeAction(primaryId, secondaryId, {
    state: 'unmerged' as MergeActionState,
    step: MergeActionStep.UNMERGE_DONE,
  })
  await notifyFrontendOrganizationUnmergeSuccessful(
    primaryId,
    secondaryId,
    primaryDisplayName,
    secondaryDisplayName,
    userId,
  )
}
