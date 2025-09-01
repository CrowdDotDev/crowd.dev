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
                    CONTEXTUAL ANALYSIS:
                    - Evaluate all available evidence holistically (bio, displayName, identities)
                    - Personal indicators (emails, education, company, location, personal websites) suggest human contributors
                    - Service patterns combined with empty personal info suggest automation
                    SIGNAL STRENGTH GUIDANCE:
                    Identities: Reserve "strong" for widely recognized service accounts (dependabot, renovate, etc.)
                    Bio: Use "strong" only when explicitly describing automated functionality
                    DisplayName: Consider context - many humans use creative names with "bot"
                    CLASSIFICATION PRINCIPLE:
                    Default to human unless confident it's an automated service. Mixed signals = lower confidence, not forced classification.
                    Respond with ONLY valid JSON and do not output anything else:
                    {
                        "isBot": boolean,
                        // include "signals" only if isBot is true
                        "signals": { "identities|bio|displayName": "weak|medium|strong" },
                        "reason": "brief explanation"
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
