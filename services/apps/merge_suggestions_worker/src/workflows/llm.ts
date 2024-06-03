import { proxyActivities } from '@temporalio/workflow'

import * as memberActivities from '../activities/memberMergeSuggestions'
import * as organizationActivities from '../activities/organizationMergeSuggestions'
import * as commonActivities from '../activities/common'

import { ILLMResult, IProcessCheckSimilarityWithLLM } from '../types'

const memberActivitiesProxy = proxyActivities<typeof memberActivities>({
  startToCloseTimeout: '1 minute',
})

const organizationActivitiesProxy = proxyActivities<typeof organizationActivities>({
  startToCloseTimeout: '1 minute',
})

const commonActivitiesProxy = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '1 minute',
})

export async function llm(args: IProcessCheckSimilarityWithLLM): Promise<void> {
  console.log('llm workflow')

  for (const memberCouple of args.memberCouples) {
    const members = await memberActivitiesProxy.getMembersForLLMConsumption(memberCouple)
    const res = await commonActivitiesProxy.getLLMResult(members, args.modelId, args.prompt)
    const result: ILLMResult = JSON.parse(res)
    console.log(`Raw res: `)
    console.log(result)
    const textResponse =
      result.generation.replace(/`/g, '').trim() === 'true' ? 'similar' : 'not similar'
    console.log(`LLM thinks that ${memberCouple[0]} and ${memberCouple[1]} are ${textResponse}`)
  }

  for (const organizationCouple of args.organizationCouples) {
    const organizations = await organizationActivitiesProxy.getOrganizationsForLLMConsumption(
      organizationCouple,
    )
    const res = await commonActivitiesProxy.getLLMResult(organizations, args.modelId, args.prompt)
    const result: ILLMResult = JSON.parse(res)
    console.log(`Raw res: `)
    console.log(result)
    const textResponse =
      result.generation.replace(/`/g, '').trim() === 'true' ? 'similar' : 'not similar'
    console.log(
      `LLM thinks that ${organizationCouple[0]} and ${organizationCouple[1]} are ${textResponse}`,
    )
  }
}
