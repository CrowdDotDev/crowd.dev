import { proxyActivities } from '@temporalio/workflow'

import { IEnrichableOrganization, OrganizationEnrichmentSource } from '@crowd/types'

import * as activities from '../activities'
import { IOrganizationEnrichmentSourceInput } from '../types'
import { sourceHasDifferentDataComparedToCache } from '../utils/common'

const {
  findOrganizationById,
  findOrganizationEnrichmentCache,
  isCacheObsolete,
  getEnrichmentInput,
  getEnrichmentData,
  createOrganizationEnrichmentCache,
  updateOrganizationEnrichmentCache,
  touchOrganizationEnrichmentCacheUpdatedAt,
  touchOrganizationEnrichmentLastTriedAt,
  normalizeEnrichmentData,
  applyEnrichmentToOrganization,
  selectMostRelevantDomainWithLLM,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '60s',
    backoffCoefficient: 2.0,
    maximumInterval: '5 minutes',
    maximumAttempts: 4,
  },
})

export async function enrichOrganization(
  input: IEnrichableOrganization,
  source: OrganizationEnrichmentSource,
): Promise<void> {
  const organization = await findOrganizationById(input.id)
  if (!organization) return

  const [cache] = await findOrganizationEnrichmentCache([source], input.id)

  // Skip if cache is still fresh
  if (!(await isCacheObsolete(source, cache))) return

  // Prepare enrichment input
  const enrichmentInput: IOrganizationEnrichmentSourceInput = await getEnrichmentInput(input)

  // Use LLM to pick the most relevant domain if multiple
  if (enrichmentInput.domains.length > 1) {
    const mostRelevantDomain = await selectMostRelevantDomainWithLLM(
      input.id,
      enrichmentInput.domains,
    )
    enrichmentInput.domains = [mostRelevantDomain]
  }

  // Skipping credit check because this workflow uses a trusted internal API.
  // If external sources are added in the future, credit checks should be implemented here.

  // Fetch new enrichment data
  const data = await getEnrichmentData(source, enrichmentInput)

  let changeInEnrichmentSourceData = false

  if (!cache) {
    // First time enriching, create cache entry
    await createOrganizationEnrichmentCache(source, input.id, data)
    if (data) {
      changeInEnrichmentSourceData = true
    }
  } else if (cache && !data) {
    // No new data, keep the old cache and update the timestamp
    await touchOrganizationEnrichmentCacheUpdatedAt(source, input.id)
  } else if (cache && data) {
    // Data changed, update cache
    if (sourceHasDifferentDataComparedToCache(cache, data)) {
      await updateOrganizationEnrichmentCache(source, input.id, data)
      changeInEnrichmentSourceData = true
    } else {
      // Data unchanged, keep the old cache and update the timestamp
      await touchOrganizationEnrichmentCacheUpdatedAt(source, input.id)
    }
  }

  // Apply enrichment only if there's new data to apply
  if (changeInEnrichmentSourceData && data) {
    const normalized = await normalizeEnrichmentData(source, data)
    await applyEnrichmentToOrganization(input.id, normalized)
  }

  // Record enrichment processing attempt
  await touchOrganizationEnrichmentLastTriedAt(input.id)
}
