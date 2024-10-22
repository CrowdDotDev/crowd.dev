import { proxyActivities } from '@temporalio/workflow'

import { IMember, MemberEnrichmentSource, MemberIdentityType, PlatformType } from '@crowd/types'

import * as activities from '../activities'
import { sourceHasDifferentDataComparedToCache } from '../utils/common'

const {
  getEnrichmentData,
  findMemberEnrichmentCache,
  insertMemberEnrichmentCache,
  touchMemberEnrichmentCacheUpdatedAt,
  updateMemberEnrichmentCache,
  isCacheObsolete,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

export async function enrichMember(
  input: IMember,
  sources: MemberEnrichmentSource[],
): Promise<void> {
  let changeInEnrichmentSourceData = false

  for (const source of sources) {
    // find if there's already saved enrichment data in source
    const cache = await findMemberEnrichmentCache(source, input.id)

    // cache is obsolete when it's not found or cache.updatedAt is older than cacheObsoleteAfterSeconds
    if (await isCacheObsolete(source, cache)) {
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

      if (!cache) {
        await insertMemberEnrichmentCache(source, input.id, data)
        if (data) {
          changeInEnrichmentSourceData = true
        }
      } else if (sourceHasDifferentDataComparedToCache(cache, data)) {
        await updateMemberEnrichmentCache(source, input.id, data)
        changeInEnrichmentSourceData = true
      } else {
        // data is same as cache, only update cache.updatedAt
        await touchMemberEnrichmentCacheUpdatedAt(source, input.id)
      }
    }
  }

  if (changeInEnrichmentSourceData) {
    console.log('Member enrichment data has been updated, use squasher again!')
    // TODO:: Implement data squasher using LLM & actual member entity enrichment logic
  }
}
