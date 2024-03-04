import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IMemberIdentity, MergeActionState } from '@crowd/types'

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
  setMergeActionState,
  syncMember,
  syncOrganization,
  notifyFrontendMemberUnmergeSuccessful,
  linkOrganizationToCache,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

export async function finishMemberMerging(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<void> {
  await moveActivitiesBetweenMembers(primaryId, secondaryId, tenantId)
  await recalculateActivityAffiliationsOfMemberAsync(primaryId, tenantId)
  await deleteMember(secondaryId)
  await setMergeActionState(primaryId, secondaryId, tenantId, 'merged' as MergeActionState)
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
  await moveActivitiesWithIdentityToAnotherMember(primaryId, secondaryId, identities, tenantId)
  await syncMember(primaryId, secondaryId)
  await syncMember(secondaryId, primaryId)
  await recalculateActivityAffiliationsOfMemberAsync(primaryId, tenantId)
  await recalculateActivityAffiliationsOfMemberAsync(secondaryId, tenantId)
  await setMergeActionState(primaryId, secondaryId, tenantId, 'unmerged' as MergeActionState)
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
  let movedSomething = true
  do {
    movedSomething = await moveActivitiesBetweenOrgs(primaryId, secondaryId, tenantId)
  } while (movedSomething)

  await deleteOrganization(secondaryId)
  await setMergeActionState(primaryId, secondaryId, tenantId, 'merged' as MergeActionState)
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
  await recalculateActivityAffiliationsOfOrganizationSynchronous(primaryId, tenantId)
  await recalculateActivityAffiliationsOfOrganizationSynchronous(secondaryId, tenantId)
  await syncOrganization(primaryId, secondaryId)
  await syncOrganization(secondaryId, primaryId)
  await linkOrganizationToCache(secondaryId)
  await setMergeActionState(primaryId, secondaryId, tenantId, 'unmerged' as MergeActionState)
  await notifyFrontendOrganizationUnmergeSuccessful(
    primaryId,
    secondaryId,
    primaryDisplayName,
    secondaryDisplayName,
    tenantId,
    userId,
  )
}
