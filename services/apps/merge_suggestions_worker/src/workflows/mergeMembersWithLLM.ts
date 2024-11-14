import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import { LLMSuggestionVerdictType } from '@crowd/types'

import * as commonActivities from '../activities/common'
import * as memberActivities from '../activities/memberMergeSuggestions'
import { ILLMResult, IProcessMergeMemberSuggestionsWithLLM } from '../types'
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
  const REGION = 'us-west-2'
  const MODEL_ID = 'anthropic.claude-3-opus-20240229-v1:0'
  const MODEL_ARGS = {
    max_tokens: 2000,
    anthropic_version: 'bedrock-2023-05-31',
    temperature: 0,
  }
  const PROMPT = `Please compare and come up with a boolean answer if these two members are the same person or not. 
                  Only compare data from first member and second member. Never compare data from only one member with itself. 
                  Never tokenize 'platform' field using character tokenization. Use word tokenization for platform field in identities.
                  You should check all the sent fields between members to find similarities both literally and semantically. 
                  Here are the fields written with respect to their importance and how to check. Identities >> Organizations > Attributes and other fields >> Display name - 
                  1. Identities: Tokenize value field (identity.value) using character tokenization. Exact match or identities with edit distance <= 2 suggests that members are similar. 
                  Don't compare identities in a single member. Only compare identities between members. 
                  2. Organizations: Members are more likely to be the same when they have/had roles in similar organizations. 
                  If there are no intersecting organizations it doesn't necessarily mean that they're different members.
                  3. Attributes and other fields: If one member have a specific field and other member doesn't, skip that field when deciding similarity. 
                  Checking semantically instead of literally is important for such fields. Important fields here are: location, timezone, languages, programming languages. 
                  For example one member might have Berlin in location, while other can have Germany - consider such members have same location.  
                  4. Display Name: Tokenize using both character and word tokenization. When the display name is more than one word, and the difference is a few edit distances consider it a strong indication of similarity. 
                  When one display name is contained by the other, check other fields for the final decision. The same members on different platforms might have different display names. 
                  Display names can be multiple words and might be sorted in different order in different platforms for the same member.
                  Pro tip: If members have identities in the same platform (member1.identities[x].platform === member2.identities[y].platform) and if these identities have different usernames(member1.identities[x].value !== member2.identities[y].value) you can label them as different. 
                  Only do such labeling if both members have identities in the same platform. If they don't have identities in the same platform ignore the pro tip. 
                  Print 'true' if they are the same member, 'false' otherwise. No explanation required. Don't print anything else.`

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

    const llmResult: ILLMResult = await commonActivitiesProxy.getLLMResult(
      members.map((member) => removeEmailLikeIdentitiesFromMember(member)),
      MODEL_ID,
      PROMPT,
      REGION,
      MODEL_ARGS,
    )

    await commonActivitiesProxy.saveLLMVerdict({
      type: LLMSuggestionVerdictType.MEMBER,
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
      await commonActivitiesProxy.mergeMembers(suggestion[0], suggestion[1], args.tenantId)
    }
  }

  await continueAsNew<typeof mergeMembersWithLLM>(args)
}
