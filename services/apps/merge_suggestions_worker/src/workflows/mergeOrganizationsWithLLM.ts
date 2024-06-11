import { proxyActivities } from '@temporalio/workflow'
import { performance } from 'perf_hooks'

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
  startToCloseTimeout: '1 minute',
})

export async function mergeOrganizationsWithLLM(
  args: IProcessMergeOrganizationSuggestionsWithLLM,
): Promise<void> {
  console.log('mergeOrganizationsWithLLM workflow')

  const SUGGESTIONS_PER_RUN = 5
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

  for (const suggestion of suggestions) {
    const organizations = await organizationActivitiesProxy.getOrganizationsForLLMConsumption(
      suggestion,
    )

    const start = performance.now()

    const end = () => {
      const end = performance.now()
      const duration = end - start
      return Math.ceil(duration / 1000)
    }

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
      responseTimeSeconds: end(),
      inputTokenCount: llmResult.body.usage.input_tokens,
      outputTokenCount: llmResult.body.usage.output_tokens,
      verdict: llmResult.body.content[0].text,
    })
  }

  // For each suggestion
  // 0. get orgs
  // 1. Get the LLM result
  // 2. Parse the LLM result and save the verdict to the database
  // 3. Act on verdict. Ie: if they're the same merge them
  // 4. Contine as new (add another arg to input, so we can control total process for testing)

  // console.log(`Total input token count: ${totalInputTokenCount}`)
  // console.log(
  //   `Average input token count per prompt: ${Math.floor(totalInputTokenCount / promptCount)}`,
  // )
}
