import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { ICleanupDuplicateMembersArgs } from '../../types'

const { getWorkflowsCount, findDuplicateMembersAfterDate, mergeMembers } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function cleanupDuplicateMembers(args: ICleanupDuplicateMembersArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100
  const cutoffDate = args.cutoffDate ?? '2025-05-18'
  const WORKFLOWS_THRESHOLD = 20

  const workflowTypeToCheck = 'finishMemberMerging'
  let workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')

  // Prevent blowing up postgres and questDb with too many merge workflows
  while (workflowsCount > WORKFLOWS_THRESHOLD) {
    console.log(`Too many running finishMemberMerging workflows (count: ${workflowsCount})`)

    // Wait for 5 minutes
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000))

    workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')
  }

  const results = await findDuplicateMembersAfterDate(cutoffDate, BATCH_SIZE)

  // execute merge in parallel
  await Promise.all(results.map((result) => mergeMembers(result.primaryId, result.secondaryId)))

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  await continueAsNew<typeof cleanupDuplicateMembers>(args)
}
