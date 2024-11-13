import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { LlmQueryType } from '@crowd/types'

import * as commonActivities from '../activities/common'
import * as memberActivities from '../activities/memberMergeSuggestions'
import { IProcessMergeMemberSuggestionsWithLLM } from '../types'
import { removeEmailLikeIdentitiesFromMember } from '../utils'

const memberActivitiesProxy = proxyActivities<typeof memberActivities>({
  startToCloseTimeout: '1 minute',
})

const commonActivitiesProxy = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '5 minute',
  retry: {
    initialInterval: '10 seconds',
    maximumAttempts: 3,
  },
})

export async function mergeMembersWithLLM(
  args: IProcessMergeMemberSuggestionsWithLLM,
): Promise<void> {
  const SUGGESTIONS_PER_RUN = 10

  const suggestions = await memberActivitiesProxy.getRawMemberMergeSuggestions(
    args.similarity,
    SUGGESTIONS_PER_RUN,
  )

  if (suggestions.length === 0) {
    return
  }

  for (const suggestion of suggestions) {
    const members = await memberActivitiesProxy.getMembersForLLMConsumption(suggestion)

    if (members.length !== 2) {
      console.log(`Failed getting members data in suggestion. Skipping suggestion: ${suggestion}`)
      continue
    }

    const verdict = await commonActivitiesProxy.getLLMResult(
      LlmQueryType.MEMBER_MERGE,
      members.map((member) => removeEmailLikeIdentitiesFromMember(member)),
    )

    if (verdict) {
      await commonActivitiesProxy.mergeMembers(suggestion[0], suggestion[1], args.tenantId)
    }
  }

  await continueAsNew<typeof mergeMembersWithLLM>(args)
}
