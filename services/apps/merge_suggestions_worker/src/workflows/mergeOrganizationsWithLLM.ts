import { proxyActivities, continueAsNew } from '@temporalio/workflow'

import * as organizationActivities from '.pnpm/node_modules/@crowd/merge-suggestions-worker/src/activities/organizationMergeSuggestions'
import * as commonActivities from '.pnpm/node_modules/@crowd/merge-suggestions-worker/src/activities/common'

import {
  ILLMResult,
  IProcessMergeOrganizationSuggestionsWithLLM,
} from '.pnpm/node_modules/@crowd/merge-suggestions-worker/src/types'
import { LLMSuggestionVerdictType } from '@crowd/types'

const organizationActivitiesProxy = proxyActivities<typeof organizationActivities>({
  startToCloseTimeout: '1 minute',
})

const commonActivitiesProxy = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '5 minute',
  retry: {
    initialInterval: '10 seconds',
    maximumAttempts: 3,
  },
})

export async function mergeOrganizationsWithLLM(
  args: IProcessMergeOrganizationSuggestionsWithLLM,
): Promise<void> {
  const SUGGESTIONS_PER_RUN = 10
  const REGION = 'us-west-2'
  const MODEL_ID = 'anthropic.claude-3-opus-20240229-v1:0'
  const MODEL_ARGS = {
    max_tokens: 2000,
    anthropic_version: 'bedrock-2023-05-31',
    temperature: 0,
  }
  const PROMPT = `Please compare and come up with a boolean answer if these two organizations are the same organization or not. Print 'true' if they are the same organization, 'false' otherwise. No explanation required. Don't print anything else.`

  const suggestions = await organizationActivitiesProxy.getRawOrganizationMergeSuggestions(
    args.similarity,
    SUGGESTIONS_PER_RUN,
    args.onlyLFXMembers,
  )

  if (suggestions.length === 0) {
    return
  }

  for (const suggestion of suggestions) {
    const organizations = await organizationActivitiesProxy.getOrganizationsForLLMConsumption(
      suggestion,
    )

    const llmResult: ILLMResult = await commonActivitiesProxy.getLLMResult(
      organizations,
      MODEL_ID,
      PROMPT,
      REGION,
      MODEL_ARGS,
    )

    await commonActivitiesProxy.saveLLMVerdict({
      type: LLMSuggestionVerdictType.ORGANIZATION,
      model: MODEL_ID,
      primaryId: suggestion[0],
      secondaryId: suggestion[1],
      prompt: llmResult.prompt,
      responseTimeSeconds: llmResult.responseTimeSeconds,
      inputTokenCount: llmResult.body.usage.input_tokens,
      outputTokenCount: llmResult.body.usage.output_tokens,
      verdict: llmResult.body.content[0].text,
    })

    if (llmResult.body.content[0].text === 'true') {
      await commonActivitiesProxy.mergeOrganizations(suggestion[0], suggestion[1], args.tenantId)
    }
  }

  await continueAsNew<typeof mergeOrganizationsWithLLM>(args)
}
