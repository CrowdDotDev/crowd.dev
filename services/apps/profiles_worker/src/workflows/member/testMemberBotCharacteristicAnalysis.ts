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
                    - Consider all available evidence holistically across the provided JSON fields.
                    - Data may be in any language, translate or interpret when needed.
                    - Human indicators: personal emails (gmail.com, outlook.com, etc.), student/education references, company affiliations, personal websites, or rich detailed bios.
                    - Bot indicators: widely recognized service accounts (dependabot, renovate, github-actions, etc.), explicit automation/CI descriptions in bio, or bot/service-like naming combined with empty personal info.
                    - Name patterns alone (e.g., "-bot", "-ci", "-deploy") are insufficient without supporting evidence.
                    SIGNAL STRENGTH GUIDE:
                    - strong: Definitive evidence (e.g., "github-actions" in identities/displayName or bio explicitly states "I am a CI bot")
                    - medium: Suggestive patterns pointing toward automation but not conclusive
                    - weak: Ambiguous hints or minimal evidence that could indicate automation
                    CLASSIFICATION RULES:
                    1. Return isBot: false ONLY when there is strong, unambiguous human evidence AND zero automation signals.
                    2. For all other cases (any automation evidence, mixed signals, or uncertainty), return isBot: true with appropriate signal strengths.
                    3. When uncertain, favor flagging for review rather than assuming human.
                    4. Report actual signal strength - do not downgrade based on mixed evidence.
                    OUTPUT FORMAT:
                    - Include "signals" object only when isBot: true
                    - Omit fields from signals that provide no automation evidence
                    - You must return ONLY valid JSON.
                    - Do NOT add code fences, explanations, or extra text.
                    - The JSON must begin with '{' and end with '}'.
                    JSON SCHEMA:
                    {
                      "isBot": boolean,
                      "signals": {
                        "identities|bio|displayName": "weak|medium|strong",
                      },
                      "reason": "<short concise explanation>"
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
