import { continueAsNew, proxyActivities, sleep } from '@temporalio/workflow'

import { EntityType } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'

import * as activities from '../activities'
import { IProcessLLMVerifiedMergesArgs } from '../types'

const {
  getUnprocessedLLMApprovedSuggestions,
  mergeMembers,
  mergeOrganizations,
  getWorkflowsCount,
  prepareOrganizationSuggestions,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function processLLMVerifiedMerges(args: IProcessLLMVerifiedMergesArgs): Promise<void> {
  const WORKFLOWS_THRESHOLD = 20
  const batchSize = args.batchSize ?? 10
  const workflowTypeToCheck =
    args.type === EntityType.MEMBER ? 'finishMemberMerging' : 'finishOrganizationMerging'

  let workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')

  if (workflowsCount > WORKFLOWS_THRESHOLD) {
    console.log(`Too many running ${workflowTypeToCheck} workflows (count: ${workflowsCount})`)
    await sleep('5 minutes')
    workflowsCount = await getWorkflowsCount(workflowTypeToCheck, 'Running')
  }

  let suggestions = await getUnprocessedLLMApprovedSuggestions(batchSize, args.type as EntityType)

  if (suggestions.length === 0) {
    console.log(`No suggestions found to process!`)
    return
  }

  if (args.type === EntityType.ORGANIZATION) {
    // swap suggestions if secondary organization has LFX membership and primary organization does not
    suggestions = await prepareOrganizationSuggestions(suggestions)
  }

  const merge = args.type === EntityType.MEMBER ? mergeMembers : mergeOrganizations

  for (const { primaryId, secondaryId } of suggestions) {
    await merge(primaryId, secondaryId)
  }

  if (!args.testRun) {
    await continueAsNew<typeof processLLMVerifiedMerges>(args)
  }
}
