import { proxyActivities, sleep } from '@temporalio/workflow'

import * as activities from '../activities'
import { IRetriggerWorkflowsArgs } from '../types'

const {
  getOrganizationMergesWithPendingState,
  mergeOrganizations,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function retriggerIncompleteWorkflows(args: IRetriggerWorkflowsArgs): Promise<void> {
    // Get cancelled workflows for the specified entity type and action
    const mergeActions = await getOrganizationMergesWithPendingState()

    // // Process each merge action
    for (const mergeAction of mergeActions) {        
        await mergeOrganizations(mergeAction.primaryId, mergeAction.secondaryId)
        // wait for 5mins before merging again
        await sleep(5 * 60 * 1000)
    }
}
