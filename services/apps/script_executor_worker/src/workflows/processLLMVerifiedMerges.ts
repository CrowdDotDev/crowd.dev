import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import * as activities from '../activities'
import { IProcessLLMVerifiedMergesArgs } from '../types'

const { getUnmergedLLMApprovedSuggestions, mergeMembers, mergeOrganizations } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function processLLMVerifiedMerges(args: IProcessLLMVerifiedMergesArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  console.log(`Processing LLM verified merges for ${args.type} with batch size ${BATCH_SIZE}!`)

  const suggestions = await getUnmergedLLMApprovedSuggestions(BATCH_SIZE, args.type as EntityType)

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
