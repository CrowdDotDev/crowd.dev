import { proxyActivities } from '@temporalio/workflow'

import { LlmQueryType } from '@crowd/types'

import * as activities from '../../activities'
import {
  IProcessMemberBotSuggestionWithLLMInput,
  MemberBotSuggestionResult,
} from '../../types/member'

const {
  findMember,
  getLLMResult,
  updateMemberAttributes,
  createMemberBotSuggestion,
  removeMemberOrganizations,
  updateMemberAffiliations,
  syncMember,
  createMemberNoBot,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 minutes',
})

export async function analyzeMemberBotCharacteristicsWithLLM(
  args: IProcessMemberBotSuggestionWithLLMInput,
): Promise<void> {
  const memberId = args.memberId
  const CONFIDENCE_THRESHOLD = 0.9

  const member = await findMember(memberId)

  if (!member) return

  // edge case: limit to top 30 verified identities for LLM evaluation
  if (member.identities) {
    member.identities = member.identities
      .sort((a, b) => (a.verified === b.verified ? 0 : a.verified ? -1 : 1))
      .slice(0, 30)
  }

  const PROMPT = `
    Your task is to analyze the following json document and decide if this member is a bot or a real human.
    <json> ${JSON.stringify(member)} </json>.
    Use both the provided fields and your knowledge of non-human accounts (e.g., bots, services, ai agents) common in open source communities.
    Check fields in this order of importance: Identities >> Attributes >> Display name.
    1. Identities: Generic or auto-generated handles (e.g., 'build-bot-123', 'ci-runner') indicate bots. 
    Username type identities take precedence over email, and known bot/service accounts should be classified as bots.
    Human-like, consistent identities across platforms suggest real members.
    2. Attributes: Includes location, languages, timezone, avatar, description, or bio. Missing attributes alone are not enough.
    Descriptions or bios that explicitly indicate bot, service, or automated behavior strongly increase bot likelihood.
    Unrealistic or placeholder values raise suspicion, while rich, natural values reduce it.
    A single strong bot signal (e.g., clear bot handle or explicit bot-related description) is enough for a high-confidence verdict.
    Mixed signals should lower confidence rather than force an incorrect decision.
    3. Display Name: Human-like names suggest real members but must be validated against identities and attributes.
    Output ONLY a valid JSON object in this format: { "isBot": <boolean>, "confidence": <float between 0 and 1> }.  
    Include the confidence score only if the member is a bot or shows bot-like signals.
    No explanation required. Don't print anything else.
  `

  const llm = await getLLMResult(LlmQueryType.MEMBER_BOT_VALIDATION, PROMPT, memberId)

  const result = JSON.parse(llm.answer) as MemberBotSuggestionResult

  if (!result.isBot) {
    await createMemberNoBot(memberId)
    return
  }

  // Mark the member as a bot directly if confidence gte the threshold
  if (CONFIDENCE_THRESHOLD <= result.confidence) {
    await updateMemberAttributes(memberId, { isBot: { default: true, system: true } })
    await removeMemberOrganizations(memberId)
    await updateMemberAffiliations(memberId)
    await syncMember(memberId, true)
  } else {
    // Otherwise, record a bot suggestion for further review
    await createMemberBotSuggestion({ memberId, confidence: result.confidence })
  }
}
