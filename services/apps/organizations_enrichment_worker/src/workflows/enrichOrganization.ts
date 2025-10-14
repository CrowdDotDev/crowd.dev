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
  fetchEnrichmentData,
  createOrganizationEnrichmentCache,
  updateOrganizationEnrichmentCache,
  touchOrganizationEnrichmentCache,
  normalizeEnrichmentData,
  applyEnrichmentToOrganization,
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
  const exists = await findOrganizationById(input.id)

  if (!exists) return

  let changeInEnrichmentSourceData = false

  // find if there's already saved enrichment data in source
  const [cache] = await findOrganizationEnrichmentCache([source], input.id)

  const cacheIsObsolete = await isCacheObsolete(source, cache)

  if (!cacheIsObsolete) return

  const enrichmentInput: IOrganizationEnrichmentSourceInput = await getEnrichmentInput(input)

  // todo: handle multiple verified primary domain case here

  const data = await fetchEnrichmentData(source, enrichmentInput)

  // todo: handle case where enrichmentdata is null

  if (!cache) {
    await createOrganizationEnrichmentCache(source, input.id, data)
    if (data) {
      changeInEnrichmentSourceData = true
    }
  } else if (sourceHasDifferentDataComparedToCache(cache, data)) {
    await updateOrganizationEnrichmentCache(source, input.id, data)
    changeInEnrichmentSourceData = true
  } else {
    // data is same as cache, only update cache.updatedAt
    await touchOrganizationEnrichmentCache(source, input.id)
  }

  if (changeInEnrichmentSourceData) {
    const normalized = await normalizeEnrichmentData(source, data)
    await applyEnrichmentToOrganization(input.id, normalized)
  }
}
