import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'

const {
  deleteMember,
  moveActivitiesBetweenMembers,
  deleteOrganization,
  moveActivitiesBetweenOrgs,
  markMergeActionDone,
  notifyFrontend,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

export async function finishMemberMerging(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<void> {
  await moveActivitiesBetweenMembers(primaryId, secondaryId, tenantId)
  await deleteMember(secondaryId)
}

export async function finishOrganizationMerging(
  primaryId: string,
  secondaryId: string,
  original: string,
  toMerge: string,
  tenantId: string,
): Promise<void> {
  let movedSomething = true
  do {
    movedSomething = await moveActivitiesBetweenOrgs(primaryId, secondaryId, tenantId)
  } while (movedSomething)

  await deleteOrganization(secondaryId)
  await markMergeActionDone(primaryId, secondaryId, tenantId)
  await notifyFrontend(primaryId, secondaryId, original, toMerge, tenantId)
}
