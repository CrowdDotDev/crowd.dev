import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { getDefaultTenantId } from '@crowd/common'
import { TemporalWorkflowId } from '@crowd/types'

import * as activities from '../../activities'
import { IRecalculateAffiliationsForNewRolesInput } from '../../types/member'

import { memberUpdate } from './memberUpdate'

const {
  getAffiliationsLastCheckedAtOfTenant,
  getMemberIdsForAffiliationUpdates,
  updateAffiliationsLastCheckedAtOfTenant,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 seconds',
})

/*
  Recalculates affiliations for members with recent role changes.
  Role changes are checked against the affiliationsLastCheckedAt date of the tenant.
  If this date is null, affiliations for all members activities are recalculated.
*/
export async function recalculateAffiliationsForNewRoles(
  input: IRecalculateAffiliationsForNewRolesInput,
): Promise<void> {
  const tenantId = getDefaultTenantId()
  const affiliationsLastChecked = await getAffiliationsLastCheckedAtOfTenant(tenantId)

  console.log(
    `Recalculating affiliations for tenant ${
      tenantId
    } with affiliationsLastChecked: ${affiliationsLastChecked} and offset ${input.offset || 0}`,
  )

  const MEMBER_PAGE_SIZE = 100
  const offset = input.offset || 0

  const memberIds = await getMemberIdsForAffiliationUpdates(
    affiliationsLastChecked,
    MEMBER_PAGE_SIZE,
    offset,
  )

  if (memberIds.length === 0) {
    await updateAffiliationsLastCheckedAtOfTenant(tenantId)
    return
  }

  // for MEMBER_PAGE_SIZE memberIds, wait execution of memberUpdate workflow for these
  // then trigger another workflow for the next MEMBER_PAGE_SIZE memberIds, using continueAsNew
  await Promise.all(
    memberIds.map((id) => {
      return executeChild(memberUpdate, {
        workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${id}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          backoffCoefficient: 2,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [
          {
            member: {
              id,
            },
          },
        ],
        searchAttributes: {},
      })
    }),
  )

  await continueAsNew<typeof recalculateAffiliationsForNewRoles>({
    offset: offset + MEMBER_PAGE_SIZE,
  })
}
