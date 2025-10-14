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
  touchOrganizationEnrichmentCache,
  normalizeEnrichmentData,
  applyEnrichmentToOrganization,
  touchOrganizationEnrichmentLastTriedAt,
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
  // 1. Check if organization exists
  const exists = await findOrganizationById(input.id)
  if (!exists) return

  // 2. Fetch cached enrichment data
  const [cache] = await findOrganizationEnrichmentCache([source], input.id)

  // 3. Check if cache is obsolete
  const cacheIsObsolete = await isCacheObsolete(source, cache)
  if (!cacheIsObsolete) return

  // 4. Get enrichment input and data
  const enrichmentInput: IOrganizationEnrichmentSourceInput = await getEnrichmentInput(input)

  // 5. If multiple domains, use LLM to pick the most relevant one
  if (enrichmentInput.domains.length > 1) {
    const mostRelevantDomain = await selectMostRelevantDomainWithLLM(
      input.id,
      enrichmentInput.domains,
    )

    enrichmentInput.domains = [mostRelevantDomain]
  }

  // 6. Get enrichment data
  const data = await getEnrichmentData(source, enrichmentInput)

  // 7. No enrichment data was fetched
  // update lastTriedAt to record the attempt
  if (!data) {
    await touchOrganizationEnrichmentLastTriedAt(input.id)
    return
  }

  // 8. Determine if there is a change in data
  // create or update enrichment cache if there is a change
  let changeInEnrichmentSourceData = false

  if (!cache) {
    await createOrganizationEnrichmentCache(source, input.id, data)
    changeInEnrichmentSourceData = true
  } else if (sourceHasDifferentDataComparedToCache(cache, data)) {
    await updateOrganizationEnrichmentCache(source, input.id, data)
    changeInEnrichmentSourceData = true
  } else {
    await touchOrganizationEnrichmentCache(source, input.id)
  }

  // 7. Apply enrichment if there is a change
  if (changeInEnrichmentSourceData) {
    const normalized = await normalizeEnrichmentData(source, data)
    await applyEnrichmentToOrganization(input.id, normalized)
  }
}
