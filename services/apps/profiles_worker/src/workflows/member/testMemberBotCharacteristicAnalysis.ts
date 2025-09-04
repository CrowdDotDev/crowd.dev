import { proxyActivities } from '@temporalio/workflow'

import { LlmQueryType } from '@crowd/types'

import * as activities from '../../activities'
import {
  MemberBotSuggestionResult,
  TestMemberBotCharacteristicAnalysisInput,
} from '../../types/member'
import { calculateMemberBotConfidence } from '../../utils'

const { getMemberForBotAnalysis, getLLMResult } = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
})

export async function testMemberBotCharacteristicAnalysis(
  args: TestMemberBotCharacteristicAnalysisInput,
): Promise<void> {
  const memberIds = args.memberIds
  const THRESHOLD = 0.9

  for (const memberId of memberIds) {
    console.log(`[TEST] Processing member ${memberId}`)

    const member = await getMemberForBotAnalysis(memberId)
    // limit to top 30 verified identities for LLM input
    if (member.identities) {
      member.identities = member.identities.slice(0, 30)
    }

    const PROMPT = `Analyze the following JSON document and determine if this member is an automated service account or a human contributor.
                    <json> ${JSON.stringify(member)} </json>
                    EVALUATION PRINCIPLES:
                    - Consider all evidence holistically (bio, displayName, identities).
                    - Member data may be in any language — translate or interpret when evaluating.
                    - Human indicators: personal emails, student/education references, company affiliations, personal websites, detailed bios.
                    - Bot indicators: recognized service accounts (dependabot, renovate, github-actions), explicit automation/CI descriptions, bot naming with empty personal info.
                    - Name patterns alone (e.g. "-bot") are never sufficient for bot classification.
                    SIGNAL STRENGTH:
                    - weak = Generic patterns or empty/minimal information
                    - medium = Suggests automation/service but not definitively 
                    - strong = Well-known service bots or explicit automation statements
                    CLASSIFICATION RULES:
                    - Default to human if any clear personal context exists.
                    - Classify as bot only if strong automation evidence exists AND no personal indicators are present.
                    - Mixed signals -> classify as human, but note the ambiguity
                    Respond with ONLY valid JSON:
                    {
                        "isBot": boolean,
                        "signals": { "identities|bio|displayName": "weak|medium|strong" },
                        "reason": "<short explanation>"
                    }
    `

    const llm = await getLLMResult(LlmQueryType.MEMBER_BOT_VALIDATION, PROMPT, memberId)

    const result = JSON.parse(llm.answer) as MemberBotSuggestionResult

    console.log(`[TEST] Member ${memberId} LLM analysis result: ${JSON.stringify(result)}`)

    if (!result.isBot) {
      continue
    }

    const confidence = calculateMemberBotConfidence(result.signals)

    console.log(`[TEST] Member ${memberId} confidence: ${confidence}`)

    // Mark the member as a bot directly if confidence gte the threshold
    if (confidence >= THRESHOLD) {
      console.log(`[TEST] Member ${memberId} has confidence more than threshold`)
    } else {
      // Otherwise, record a bot suggestion for further review
      console.log(`[TEST] Member ${memberId} has confidence less than threshold`)
    }
  }
}
