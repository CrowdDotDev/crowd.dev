import { proxyActivities } from '@temporalio/workflow'

import * as commonActivities from '../activities/common'
import * as memberActivities from '../activities/memberMergeSuggestions'
import * as organizationActivities from '../activities/organizationMergeSuggestions'
import { ILLMResult, IProcessCheckSimilarityWithLLM } from '../types'
import { removeEmailLikeIdentitiesFromMember } from '../utils'

const memberActivitiesProxy = proxyActivities<typeof memberActivities>({
  startToCloseTimeout: '1 minute',
})

const organizationActivitiesProxy = proxyActivities<typeof organizationActivities>({
  startToCloseTimeout: '1 minute',
})

const commonActivitiesProxy = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '1 minute',
})

export async function testMergingEntitiesWithLLM(
  args: IProcessCheckSimilarityWithLLM,
): Promise<void> {
  console.log('llm workflow')

  let totalInputTokenCount = 0
  let promptCount = 0

  if (args.memberCouples && args.memberCouples.length > 0) {
    for (const memberCouple of args.memberCouples) {
      console.log(`Checking similarity between: ${memberCouple[0]} and ${memberCouple[1]}`)

      const members = await memberActivitiesProxy.getMembersForLLMConsumption(memberCouple)

      if (members.length !== 2) {
        console.log(
          `Failed getting members data in suggestion. Skipping suggestion: ${memberCouple}`,
        )
        continue
      }

      const res: ILLMResult = await commonActivitiesProxy.getLLMResult(
        members.map((member) => removeEmailLikeIdentitiesFromMember(member)),
        args.modelId,
        args.prompt,
        args.region,
        args.modelSpecificArgs,
      )
      console.log(`Raw res: `)
      console.log(res.body)
      totalInputTokenCount += res.body.usage.input_tokens
      promptCount += 1
    }
  }

  if (args.organizationCouples && args.organizationCouples.length > 0) {
    for (const organizationCouple of args.organizationCouples) {
      console.log(
        `Checking similarity between: ${organizationCouple[0]} and ${organizationCouple[1]}`,
      )
      const organizations =
        await organizationActivitiesProxy.getOrganizationsForLLMConsumption(organizationCouple)

      if (organizations.length !== 2) {
        console.log(
          `Failed getting organization data in suggestion. Skipping suggestion: ${organizationCouple}`,
        )
        continue
      }

      const res = await commonActivitiesProxy.getLLMResult(
        organizations,
        args.modelId,
        args.prompt,
        args.region,
        args.modelSpecificArgs,
      )
      console.log(`Raw res: `)
      console.log(res.body)
      totalInputTokenCount += res.body.usage.input_tokens
      promptCount += 1
    }
  }

  console.log(`Total input token count: ${totalInputTokenCount}`)
  console.log(
    `Average input token count per prompt: ${Math.floor(totalInputTokenCount / promptCount)}`,
  )
}
