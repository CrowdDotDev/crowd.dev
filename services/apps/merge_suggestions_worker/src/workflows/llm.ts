import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/memberMergeSuggestions'
import { ILLMResult, IProcessCheckMemberSimilarityWithLLM } from '../types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function llm(args: IProcessCheckMemberSimilarityWithLLM): Promise<void> {
  console.log('llm workflow')

  for (const memberCouple of args.memberCouples) {
    const members = await activity.getMembersForLLMConsumption(memberCouple)
    const res = await activity.getLLMResult(members, args.modelId, args.prompt, args.region)
    const result: ILLMResult = JSON.parse(res)
    console.log(`Raw res: `)
    console.log(result)
    const textResponse =
      result.generation.replace(/`/g, '').trim() === 'true' ? 'similar' : 'not similar'
    console.log(`LLM thinks that ${memberCouple[0]} and ${memberCouple[1]} are ${textResponse}`)
  }
}
