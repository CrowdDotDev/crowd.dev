import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IRetriggerWorkflowsArgs } from '../types'
import { MergeActionStep, MergeActionType, IUnmergeBackup, IMemberUnmergeBackup, IOrganizationUnmergeBackup } from '@crowd/types'

const {
  getCancelledMergeAndUnmergeWorkflows,
  resetMergeActionState,
  mergeMembers,
  unmergeMembers,
  mergeOrganizations,
  unmergeOrganizations,
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

    // Process each merge action
    for (const mergeAction of mergeActions) {
        // Reset the merge action state to pending
        await resetMergeActionState(mergeAction.primaryId, mergeAction.secondaryId)
        
        // Retrigger the appropriate workflow based on entity type and action
        if (entityType === 'member') {
            if (action === 'merge') {
                await mergeMembers(mergeAction.primaryId, mergeAction.secondaryId)
            } else {
                await unmergeMembers(mergeAction.primaryId, mergeAction.unmergeBackup as IUnmergeBackup<IMemberUnmergeBackup>)
            }
        } else {
            if (action === 'merge') {
                await mergeOrganizations(mergeAction.primaryId, mergeAction.secondaryId)
            } else {
                await unmergeOrganizations(mergeAction.primaryId, mergeAction.unmergeBackup as IUnmergeBackup<IOrganizationUnmergeBackup>)
            }
        }
    }
}
