import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import * as activities from '../activities'
import { IProcessLLMVerifiedMergesArgs } from '../types'

const {
  getUnprocessedLLMApprovedSuggestions,
  mergeMembers,
  mergeOrganizations,
  getWorkflowsCount,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function processLLMVerifiedMerges(args: IProcessLLMVerifiedMergesArgs): Promise<void> {
  const SUGGESTIONS_PER_RUN = args.batchSize ?? 10
  const WORKFLOWS_THRESHOLD = 20

  const workflowTypeToCheck =
    args.type === EntityType.MEMBER ? 'finishMemberMerging' : 'finishOrganizationMerging'
  let workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')

  while (workflowsCount > WORKFLOWS_THRESHOLD) {
    console.log(`Too many running ${workflowTypeToCheck} workflows (${workflowsCount})`)

    // Wait for 5 minutes
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000))

    workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')
  }

  const suggestions = await getUnprocessedLLMApprovedSuggestions(
    SUGGESTIONS_PER_RUN,
    args.type as EntityType,
  )

  if (suggestions.length === 0) {
    console.log('No more LLM verified suggestions to process!')
    return
  }

  // Determine the correct merge function based on entity type
  const mergeFunction = args.type === EntityType.MEMBER ? mergeMembers : mergeOrganizations

  await Promise.all(
    suggestions.map((suggestion) => mergeFunction(suggestion.primaryId, suggestion.secondaryId)),
  )

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof processLLMVerifiedMerges>(args)
}
