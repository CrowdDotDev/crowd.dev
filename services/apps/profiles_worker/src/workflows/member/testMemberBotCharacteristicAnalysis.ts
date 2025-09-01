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

    const PROMPT = `Your task is to analyze the following json document and decide if this member is a bot or a real human.
                  <json> ${JSON.stringify(member)} </json>.
                  Use both the provided fields and your knowledge of non-human accounts (e.g., bots, services, ai agents) common in communities.
                  Evaluate fields in this priority: identities >> bio >> displayName.
                  1. Identities: Generic or auto-generated handles (e.g., 'build-bot-123', 'ci-runner') indicate bots. 
                  Username type identities take precedence over email, and known bot/service accounts should be classified as bots.
                  Human-like, consistent identities across platforms suggest real members.
                  2. Bio: Descriptions or bios that explicitly indicate bot, service, or automated behavior strongly increase bot likelihood.
                  Unrealistic or placeholder values raise suspicion, while rich, natural values reduce it.
                  A single strong bot signal (e.g., clear bot handle or explicit bot-related description) is enough for a high-confidence verdict.
                  Mixed signals should lower confidence rather than force an incorrect decision.
                  3. Display Name: Human-like names suggest real members but must be validated against identities and bio.
                  Signal strengths must be one of: "weak", "medium", or "strong".
                  Output Rules:
                  - Return only a JSON object in this format:
                  {
                    "isBot": <boolean>,
                    "signals": { "<signalType>": "<strength>", ... },   // include only if isBot is true
                    "reason": "<short one-line concise explanation>"
                  }
                  - <signalType> must be the relevant root field from the input (e.g., "identities", "bio", "displayName").
                  - Include all applicable signal keys if isBot is true.
                  - If isBot is false, omit "signals" entirely and only output "isBot" and "reason". Do not output anything else.
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
