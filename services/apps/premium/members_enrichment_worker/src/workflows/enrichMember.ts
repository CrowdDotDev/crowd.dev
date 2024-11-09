import { proxyActivities } from '@temporalio/workflow'

import { IEnrichableMember, MemberEnrichmentSource } from '@crowd/types'

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
  normalizeEnrichmentData,
  getEnrichmentInput,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
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
    const cache = await findMemberEnrichmentCache(source, input.id)

    // cache is obsolete when it's not found or cache.updatedAt is older than cacheObsoleteAfterSeconds
    if (await isCacheObsolete(source, cache)) {
      const enrichmentInput: IEnrichmentSourceInput = await getEnrichmentInput(input)

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
    const toBeSquashed = {}
    for (const source of sources) {
      // find if there's already saved enrichment data in source
      const cache = await findMemberEnrichmentCache(source, input.id)
      if (cache && cache.data) {
        const normalized = await normalizeEnrichmentData(source, cache.data)
        toBeSquashed[source] = normalized
      }
    }

    // TODO:: Implement data squasher using LLM & actual member entity enrichment logic
  }
}
