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

  // if (workflowsCount > 100) {
  //   console.log(
  //     `Too many running ${workflowTypeToCheck} workflows (${workflowsCount}). Waiting for  minutes.`,
  //   )

  //   // Wait for 30 minutes before processing the next batch
  //   await new Promise((resolve) => setTimeout(resolve, 30 * 60 * 1000))
  // }

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

  await new Promise((resolve) => setTimeout(resolve, 60 * 1000))

  const workflowTypeToCheck =
    args.type === EntityType.MEMBER ? 'finishMemberMerging' : 'finishOrganizationMerging'
  const workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')

  console.log(`Running ${workflowsCount} ${workflowTypeToCheck} workflows`)

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof processLLMVerifiedMerges>(args)
}
