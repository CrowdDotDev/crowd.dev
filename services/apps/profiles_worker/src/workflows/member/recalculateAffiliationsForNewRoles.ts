import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { memberUpdate } from './memberUpdate'

import * as activities from '../../activities'
import { TemporalWorkflowId } from '@crowd/types'
import { ITenantWithIdOnly } from '../../types/member'

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
export async function recalculateAffiliationsForNewRoles(input: ITenantWithIdOnly): Promise<void> {
  try {
    const affiliationsLastChecked = await getAffiliationsLastCheckedAtOfTenant(input.tenant.id)

    const MEMBER_PAGE_SIZE = 100
    let offset = 0

    let memberIds = await getMemberIdsForAffiliationUpdates(
      affiliationsLastChecked,
      MEMBER_PAGE_SIZE,
      offset,
    )

    while (memberIds.length > 0) {
      // for MEMBER_PAGE_SIZE memberIds, wait execution of memberUpdate workflow for these, and get new memberIds
      await Promise.all(
        memberIds.map((id) => {
          return executeChild(memberUpdate, {
            workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${input.tenant.id}/${id}`,
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
            searchAttributes: {
              TenantId: [input.tenant.id],
            },
          })
        }),
      )

      offset += MEMBER_PAGE_SIZE
      memberIds = await getMemberIdsForAffiliationUpdates(
        affiliationsLastChecked,
        MEMBER_PAGE_SIZE,
        offset,
      )
    }

    await updateAffiliationsLastCheckedAtOfTenant(input.tenant.id)
  } catch (err) {
    throw new Error(err)
  }
}
