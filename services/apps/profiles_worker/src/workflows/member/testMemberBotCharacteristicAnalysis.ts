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

    const PROMPT = `Analyze the following JSON metadata about a contributor and determine if they are 
                    likely an automation/service account or a human contributor.
                    <json>${JSON.stringify(member)}</json>
                    EVALUATION PRINCIPLES:
                    - Consider all available evidence holistically across the provided JSON fields.
                    - Data may be in any language, translate or interpret when needed.
                    - Automation/service indicators include:
                      * Known service accounts (e.g., dependabot, renovate, github-actions, GitLab CI, release-drafter, semantic-release)
                      * CI/CD, release automation, deployment, monitoring, moderation bots
                      * Platform-native automation (e.g., Reddit AutoModerator, StackOverflow Community user)
                      * Generic handles with empty or minimal personal info
                    - Human indicators include:
                      * Personal emails, student/education references
                      * Employment or company affiliations
                      * Personal websites, portfolios, or social media links
                      * Detailed bios with personal background
                    - Name patterns alone (e.g., "-bot", "-ci", "-actions") are never sufficient without supporting evidence.
                    - If both strong human and strong automation signals appear, treat as ambiguous and classify with signals.
                    SIGNAL STRENGTH GUIDE:
                    - weak = Generic or minimal suggestion
                    - medium = Some evidence but not definitive
                    - strong = Clear, explicit, or well-known evidence
                    CLASSIFICATION RULES:
                    - If there is strong human evidence and no automation evidence, return isBot: false.
                    - Otherwise, return isBot: true and provide signal strengths for each available field.
                    - Include signals in the response only if isBot is true.
                    OUTPUT FORMAT:
                    - You must return ONLY valid JSON.
                    - Do NOT add code fences, explanations, or extra text.
                    - The JSON must begin with '{' and end with '}'.
                    SCHEMA:
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
