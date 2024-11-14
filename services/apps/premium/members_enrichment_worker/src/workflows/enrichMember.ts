import { proxyActivities } from '@temporalio/workflow'

import {
  IEnrichableMember,
  MemberEnrichmentSource,
  MemberIdentityType,
  PlatformType,
} from '@crowd/types'

import * as activities from '../activities'
import { IEnrichmentSourceInput } from '../types'
import { sourceHasDifferentDataComparedToCache } from '../utils/common'

const {
  getEnrichmentData,
  findMemberEnrichmentCache,
  insertMemberEnrichmentCache,
  touchMemberEnrichmentCacheUpdatedAt,
  updateMemberEnrichmentCache,
  isCacheObsolete,
  findMemberIdentityWithTheMostActivityInPlatform,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '20 seconds',
  retry: {
    initialInterval: '5s',
    backoffCoefficient: 2.0,
    maximumInterval: '30s',
    maximumAttempts: 4,
  },
})

export async function enrichMember(
  input: IEnrichableMember,
  sources: MemberEnrichmentSource[],
): Promise<void> {
  let changeInEnrichmentSourceData = false

  for (const source of sources) {
    // find if there's already saved enrichment data in source
    const caches = await findMemberEnrichmentCache([source], input.id)
    const cache = caches.find((c) => c.source === source)

    // cache is obsolete when it's not found or cache.updatedAt is older than cacheObsoleteAfterSeconds
    if (await isCacheObsolete(source, cache)) {
      const enrichmentInput: IEnrichmentSourceInput = {
        memberId: input.id,
        email: input.identities.find((i) => i.verified && i.type === MemberIdentityType.EMAIL),
        linkedin: input.identities.find(
          (i) =>
            i.verified &&
            i.platform === PlatformType.LINKEDIN &&
            i.type === MemberIdentityType.USERNAME,
        ),
        displayName: input.displayName || undefined,
        website: input.website || undefined,
        location: input.location || undefined,
        activityCount: input.activityCount || 0,
      }

      // there can be multiple verified identities in github, we select the one with the most activities
      const verifiedGithubIdentities = input.identities.filter(
        (i) =>
          i.verified &&
          i.platform === PlatformType.GITHUB &&
          i.type === MemberIdentityType.USERNAME,
      )

      if (verifiedGithubIdentities.length > 1) {
        const ghIdentityWithTheMostActivities =
          await findMemberIdentityWithTheMostActivityInPlatform(input.id, PlatformType.GITHUB)
        if (ghIdentityWithTheMostActivities) {
          enrichmentInput.github = input.identities.find(
            (i) =>
              i.verified &&
              i.platform === PlatformType.GITHUB &&
              i.type === MemberIdentityType.USERNAME &&
              i.value === ghIdentityWithTheMostActivities.username,
          )
        }
      } else {
        enrichmentInput.github = verifiedGithubIdentities?.[0] || undefined
      }

      const data = await getEnrichmentData(source, enrichmentInput)

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
    // Member enrichment data has been updated, use squasher again!
    // TODO member enrichment: enable once we are sure it's working
    // await processMemberSources(input.id, sources)
  }
}
