import { proxyActivities } from '@temporalio/workflow'

import { IMemberIdentity, MergeActionState, MergeActionStep } from '@crowd/types'

import * as activities from '../activities'

const {
  deleteMember,
  moveActivitiesBetweenMembers,
  deleteOrganization,
  moveActivitiesBetweenOrgs,
  notifyFrontendOrganizationMergeSuccessful,
  notifyFrontendOrganizationUnmergeSuccessful,
  moveActivitiesWithIdentityToAnotherMember,
  recalculateActivityAffiliationsOfMemberAsync,
  recalculateActivityAffiliationsOfOrganizationSynchronous,
  setMergeAction,
  syncMember,
  syncOrganization,
  notifyFrontendMemberMergeSuccessful,
  notifyFrontendMemberUnmergeSuccessful,
  syncRemoveMember,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
})

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
  await moveActivitiesBetweenMembers(primaryId, secondaryId, tenantId)
  await recalculateActivityAffiliationsOfMemberAsync(primaryId, tenantId)
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
  await moveActivitiesWithIdentityToAnotherMember(primaryId, secondaryId, identities, tenantId)
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

  await syncOrganization(primaryId)
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
  await syncOrganization(primaryId)
  await syncOrganization(secondaryId)
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
