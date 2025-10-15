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
  normalizeEnrichmentData,
  applyEnrichmentToOrganization,
  touchOrganizationEnrichmentLastTriedAt,
  touchOrganizationEnrichmentLastUpdatedAt,
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
  // Check if organization exists
  const exists = await findOrganizationById(input.id)
  if (!exists) return

  await touchOrganizationEnrichmentLastTriedAt(input.id)

  // Fetch cached enrichment data
  const [cache] = await findOrganizationEnrichmentCache([source], input.id)

  // Check if cache is obsolete
  const cacheIsObsolete = await isCacheObsolete(source, cache)
  if (!cacheIsObsolete) return

  // Get enrichment input and data
  const enrichmentInput: IOrganizationEnrichmentSourceInput = await getEnrichmentInput(input)

  // If multiple domains, use LLM to pick the most relevant one
  if (enrichmentInput.domains.length > 1) {
    const mostRelevantDomain = await selectMostRelevantDomainWithLLM(
      input.id,
      enrichmentInput.domains,
    )

    enrichmentInput.domains = [mostRelevantDomain]
  }

  // Get enrichment data
  const data = await getEnrichmentData(source, enrichmentInput)

  // No enrichment data was fetched
  if (!data) {
    return
  }

  // Determine if there is a change in data
  // create or update enrichment cache if there is a change
  let changeInEnrichmentSourceData = false

  if (!cache) {
    await createOrganizationEnrichmentCache(source, input.id, data)
    changeInEnrichmentSourceData = true
  } else if (sourceHasDifferentDataComparedToCache(cache, data)) {
    await updateOrganizationEnrichmentCache(source, input.id, data)
    changeInEnrichmentSourceData = true
  } else {
    await touchOrganizationEnrichmentCacheUpdatedAt(source, input.id)
  }

  // Apply enrichment if there is a change
  if (changeInEnrichmentSourceData) {
    const normalized = await normalizeEnrichmentData(source, data)
    await applyEnrichmentToOrganization(input.id, normalized)
    await touchOrganizationEnrichmentLastUpdatedAt(input.id)
  }
}
