import { proxyActivities, sleep } from '@temporalio/workflow'

import * as activities from '../activities'
import { IRetriggerWorkflowsArgs } from '../types'
import { MergeActionStep, MergeActionType } from '@crowd/types'

const {
  getCancelledMergeAndUnmergeWorkflows,
  resetMergeActionState,
  mergeMembers,
  mergeOrganizations,
  triggerUnmergeWorkflow,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function retriggerIncompleteWorkflows(args: IRetriggerWorkflowsArgs): Promise<void> {
    const { entityType, action, batchSize } = args
    
    // Determine the merge action type
    const mergeActionType = entityType === 'member' ? MergeActionType.MEMBER : MergeActionType.ORG
    
    // Determine the merge action step based on action
    const mergeActionStep = action === 'merge' 
        ? MergeActionStep.MERGE_ASYNC_STARTED 
        : MergeActionStep.UNMERGE_ASYNC_STARTED

    // Get cancelled workflows for the specified entity type and action
    const mergeActions = await getCancelledMergeAndUnmergeWorkflows(mergeActionType, mergeActionStep, batchSize)

    // // Process each merge action
    for (const mergeAction of mergeActions) {        
        if (entityType === 'member') {
            if (action === 'merge') {
                await mergeMembers(mergeAction.primaryId, mergeAction.secondaryId)
            } else {
                await triggerUnmergeWorkflow(mergeAction.primaryId, mergeAction.secondaryId, mergeActionType, mergeAction.actionBy)
            }
        } else {
            if (action === 'merge') {
                await mergeOrganizations(mergeAction.primaryId, mergeAction.secondaryId)

                // wait for 5mins before merging again
                await sleep(5 * 60 * 1000)
            } else {
                await triggerUnmergeWorkflow(mergeAction.primaryId, mergeAction.secondaryId, mergeActionType, mergeAction.actionBy)
            }
        }
    }

}
