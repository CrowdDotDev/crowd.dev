import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { LlmQueryType } from '@crowd/types'

import * as commonActivities from '../activities/common'
import * as organizationActivities from '../activities/organizationMergeSuggestions'
import { IProcessMergeOrganizationSuggestionsWithLLM } from '../types'

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
  const SUGGESTIONS_PER_RUN = 5

  const suggestions = await organizationActivitiesProxy.getRawOrganizationMergeSuggestions(
    args.tenantId,
    args.similarity,
    SUGGESTIONS_PER_RUN,
    args.onlyLFXMembers,
    args.organizationIds,
  )

  if (suggestions.length === 0) {
    return
  }

  for (const suggestion of suggestions) {
    const organizations =
      await organizationActivitiesProxy.getOrganizationsForLLMConsumption(suggestion)

    if (organizations.length !== 2) {
      console.log(
        `Failed getting organization data in suggestion. Skipping suggestion: ${suggestion}`,
      )
      continue
    }

    const verdict = await commonActivitiesProxy.getLLMResult(
      LlmQueryType.ORGANIZATION_MERGE,
      organizations,
    )

    if (verdict) {
      console.log(
        `LLM verdict says these two orgs are the same. Merging organizations: ${suggestion[0]} and ${suggestion[1]}!`,
      )
      await commonActivitiesProxy.mergeOrganizations(suggestion[0], suggestion[1], args.tenantId)
    }
  }

  await continueAsNew<typeof mergeOrganizationsWithLLM>(args)
}
