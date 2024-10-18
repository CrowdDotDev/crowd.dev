import lodash from 'lodash'
import { proxyActivities } from '@temporalio/workflow'

import { IMember, MemberEnrichmentSource, MemberIdentityType, PlatformType } from '@crowd/types'

import * as activities from '../activities'

const { getEnrichmentData, findMemberEnrichmentCache, insertMemberEnrichmentCache } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '10 seconds',
  })

export async function enrichMember(input: IMember): Promise<void> {
  const sources = [MemberEnrichmentSource.PROGAI]

  for (const source of sources) {
    // get raw data from enrichment source
    const data = await getEnrichmentData(source, {
      github: input.identities.find(
        (i) =>
          i.verified &&
          i.platform === PlatformType.GITHUB &&
          i.type === MemberIdentityType.USERNAME,
      ),
      email: input.identities.find((i) => i.verified && i.type === MemberIdentityType.EMAIL),
      linkedin: input.identities.find(
        (i) =>
          i.verified &&
          i.platform === PlatformType.LINKEDIN &&
          i.type === MemberIdentityType.USERNAME,
      ),
    })

    // find if there's already a raw data
    const cache = await findMemberEnrichmentCache(source, input.id)

    if (!cache || !lodash.isEqual(data, cache.data)) {
      await insertMemberEnrichmentCache(source, input.id, data)
    }
  }

  // TODO:: Implement data squasher using LLM & actual member entity enrichment logic
}
