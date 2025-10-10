import { continueAsNew, proxyActivities, sleep } from '@temporalio/workflow'

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
  const testRun = args.testRun ?? false
  const cutoffDate = args.cutoffDate ?? '2025-05-18'
  const checkByActivityIdentity = args.checkByActivityIdentity ?? false
  const checkByTwitterIdentity = args.checkByTwitterIdentity ?? false
  const WORKFLOWS_THRESHOLD = 20

  const workflowTypeToCheck = 'finishMemberMerging'
  let workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')

  // Prevent blowing up postgres with too many merge workflows
  while (workflowsCount > WORKFLOWS_THRESHOLD) {
    console.log(`Too many running finishMemberMerging workflows (count: ${workflowsCount})`)

    // Wait for 5 minutes
    await sleep('5 minutes')

    workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')
  }

  const results = await findDuplicateMembersAfterDate(
    cutoffDate,
    BATCH_SIZE,
    checkByActivityIdentity,
    checkByTwitterIdentity,
  )

  if (results.length === 0) {
    console.log('No duplicate members found!')
    return
  }

  // execute merge in parallel
  try {
    await Promise.all(
      results.map((result) => {
        console.log(`Merging members ${result.primaryId} and ${result.secondaryId}`)
        return mergeMembers(result.primaryId, result.secondaryId)
      }),
    )
  } catch (error) {
    console.error('Error merging members!', error)
  }

  if (testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  await continueAsNew<typeof cleanupDuplicateMembers>(args)
}
