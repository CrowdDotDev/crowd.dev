import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/memberMergeSuggestions'
import { ILLMResult, IProcessCheckMemberSimilarityWithLLM } from '../types'

const activity = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function llm(args: IProcessCheckMemberSimilarityWithLLM): Promise<void> {
  console.log('llm workflow')

  for (const memberCouple of args.memberCouples) {
    console.log(`Asking LLM if [${memberCouple[0]}] and [${memberCouple[1]}] are same.`)
    const members = await activity.getMembersForLLMConsumption(memberCouple)
    if (members.length !== 2) {
      console.log(`Member(s) were not found in the db for couple [${memberCouple}] skipping!`)
      continue
    }
    const res = await activity.getLLMResult(
      members,
      args.modelId,
      args.prompt,
      args.region,
      args.modelSpecificArgs,
    )
    const result: ILLMResult = JSON.parse(res)
    console.log(`Raw res: `)
    console.log(result)
    // const textResponse =
    //   result.generation.replace(/`/g, '').trim() === 'true' ? 'similar' : 'not similar'
    // console.log(`LLM thinks that ${memberCouple[0]} and ${memberCouple[1]} are ${textResponse}`)
  }
}
