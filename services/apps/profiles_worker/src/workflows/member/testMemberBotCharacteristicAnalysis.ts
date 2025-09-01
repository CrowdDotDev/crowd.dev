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

    const PROMPT = `Your task is to analyze the following JSON document and decide whether the member is an automated/bot account or a human contributor.
                    <json> ${JSON.stringify(member)} </json>
                    Input may include displayName, bio, and identities (usernames, emails, URLs). Sometimes only identities are provided.
                    Guidelines:
                    - Use both the provided fields and your knowledge of common bots, services, and automated accounts in communities.
                    - Do not rely solely on pattern-matching (e.g., presence of '-bot' in a username). Instead, consider the overall context of all available fields together.
                    - If displayName or bio clearly indicate a real person, treat that as strong human evidence even if an identity looks bot-like.
                    - If only identities are available, rely on them but adjust confidence according to how strongly they resemble automation patterns.
                    - Treat identities as strong bot evidence only if they match well-known or standard bot/service accounts (e.g., dependabot, renovate, github-actions).
                    - Do not classify as a bot solely because a username or displayName contains “bot” or “robot”. Many real users include these terms.
                    - Mixed signals should reduce confidence rather than force a wrong decision.
                    Respond with ONLY valid JSON in the format and do not output anything else:
                    {
                        "isBot": boolean,           
                        // include "signals" only if isBot is true             
                        "signals": { "identities"|"bio"|"displayName": "weak|medium|strong" },
                        "reason": "<short one-line concise explanation>"
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
