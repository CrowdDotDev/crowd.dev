import uniqBy from 'lodash.uniqby'

import {
  OrganizationField,
  fetchOrganizationEnrichmentCache,
  findOrgAttributes,
  findOrgById,
  insertOrganizationEnrichmentCache,
  prepareOrganizationData,
  setOrganizationEnrichmentCacheUpdatedAt,
  setOrganizationEnrichmentLastTriedAt,
  setOrganizationEnrichmentLastUpdatedAt,
  updateOrganization,
  updateOrganizationEnrichmentCache as updateOrganizationEnrichmentCacheDb,
  upsertOrgAttributes,
  upsertOrgIdentities,
} from '@crowd/data-access-layer'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { refreshMaterializedView } from '@crowd/data-access-layer/src/utils'
import { RateLimitBackoff, RedisCache } from '@crowd/redis'
import {
  IEnrichableOrganization,
  IOrganizationEnrichmentCache,
  OrganizationAttributeSource,
  OrganizationEnrichmentSource,
  OrganizationIdentityType,
} from '@crowd/types'

import { OrganizationEnrichmentSourceServiceFactory } from '../factory'
import { svc } from '../main'
import {
  IOrganizationEnrichmentData,
  IOrganizationEnrichmentDataNormalized,
  IOrganizationEnrichmentService,
  IOrganizationEnrichmentSourceInput,
} from '../types'

export async function refreshOrganizationEnrichmentMaterializedView(mvName: string): Promise<void> {
  await refreshMaterializedView(svc.postgres.writer.connection(), mvName)
}

export async function getMaxConcurrentRequests(
  organizations: IEnrichableOrganization[],
  possibleSources: OrganizationEnrichmentSource[],
  concurrencyLimit: number,
): Promise<number> {
  const serviceMap: Partial<Record<OrganizationEnrichmentSource, IOrganizationEnrichmentService>> =
    {}
  const currentProcessingActivityCount = organizations[0].activityCount

  let maxConcurrentRequestsInAllSources = concurrencyLimit

  for (const source of possibleSources) {
    serviceMap[source] = OrganizationEnrichmentSourceServiceFactory.getEnrichmentSourceService(
      source,
      svc.log,
    )

    const activityCountCutoff = serviceMap[source].enrichOrganizationsWithActivityMoreThan
    if (!activityCountCutoff || activityCountCutoff <= currentProcessingActivityCount) {
      maxConcurrentRequestsInAllSources = Math.min(
        maxConcurrentRequestsInAllSources,
        serviceMap[source].maxConcurrentRequests,
      )
    }
  }

  svc.log.info('Setting max concurrent requests', { maxConcurrentRequestsInAllSources })

  return maxConcurrentRequestsInAllSources
}

export async function createOrganizationEnrichmentCache(
  source: OrganizationEnrichmentSource,
  organizationId: string,
  data: IOrganizationEnrichmentData,
): Promise<void> {
  const qx = dbStoreQx(svc.postgres.writer)
  await insertOrganizationEnrichmentCache(qx, organizationId, data, source)
}

export async function findOrganizationEnrichmentCache(
  source: OrganizationEnrichmentSource[],
  organizationId: string,
): Promise<IOrganizationEnrichmentCache<IOrganizationEnrichmentData>[]> {
  const qx = dbStoreQx(svc.postgres.reader)
  return fetchOrganizationEnrichmentCache(qx, organizationId, source)
}

export async function updateOrganizationEnrichmentCache(
  source: OrganizationEnrichmentSource,
  organizationId: string,
  data: IOrganizationEnrichmentData,
): Promise<void> {
  const qx = dbStoreQx(svc.postgres.writer)
  await updateOrganizationEnrichmentCacheDb(qx, organizationId, data, source)
}

export async function touchOrganizationEnrichmentCache(
  source: OrganizationEnrichmentSource,
  organizationId: string,
): Promise<void> {
  const qx = dbStoreQx(svc.postgres.writer)
  await setOrganizationEnrichmentCacheUpdatedAt(qx, organizationId, source)
}

export async function touchOrganizationEnrichmentLastUpdatedAt(
  organizationId: string,
): Promise<void> {
  const qx = dbStoreQx(svc.postgres.writer)
  await setOrganizationEnrichmentLastUpdatedAt(qx, organizationId)
}

export async function touchOrganizationEnrichmentLastTriedAt(
  organizationId: string,
): Promise<void> {
  const qx = dbStoreQx(svc.postgres.writer)
  await setOrganizationEnrichmentLastTriedAt(qx, organizationId)
}

export async function isCacheObsolete(
  source: OrganizationEnrichmentSource,
  cache: IOrganizationEnrichmentCache<IOrganizationEnrichmentData>,
): Promise<boolean> {
  const service = OrganizationEnrichmentSourceServiceFactory.getEnrichmentSourceService(
    source,
    svc.log,
  )
  return (
    !cache ||
    Date.now() - new Date(cache.updatedAt).getTime() > 1000 * service.cacheObsoleteAfterSeconds
  )
}

async function setRateLimitBackoff(
  source: OrganizationEnrichmentSource,
  backoffSeconds: number,
): Promise<void> {
  const redisCache = new RedisCache(`organization-enrichment-${source}`, svc.redis, svc.log)
  const backoff = new RateLimitBackoff(redisCache, 'rate-limit-backoff')
  await backoff.set(backoffSeconds)
}

export async function getEnrichmentInput(
  input: IEnrichableOrganization,
): Promise<IOrganizationEnrichmentSourceInput> {
  const verifiedPrimaryDomains = input.identities.filter(
    (i) => i.type === OrganizationIdentityType.PRIMARY_DOMAIN && i.verified,
  )

  // dedup domains by value (keep first occurrence)
  const uniqueDomains = uniqBy(verifiedPrimaryDomains, 'value')

  return {
    organizationId: input.id,
    domains: uniqueDomains,
    displayName: input.displayName,
    activityCount: input.activityCount || 0,
  }
}

export async function getEnrichmentData(
  source: OrganizationEnrichmentSource,
  input: IOrganizationEnrichmentSourceInput,
): Promise<IOrganizationEnrichmentData | null> {
  const service = OrganizationEnrichmentSourceServiceFactory.getEnrichmentSourceService(
    source,
    svc.log,
  )

  if (await service.isEnrichableBySource(input)) {
    try {
      return await service.getData(input)
    } catch (err) {
      if (err.name === 'EnrichmentRateLimitError') {
        await setRateLimitBackoff(source, err.rateLimitResetSeconds)
        svc.log.warn(`${source} rate limit exceeded. Skipping enrichment source.`)
        return null
      }

      svc.log.error({ source, err }, 'Error getting enrichment data!')
      throw err
    }
  }

  return null
}

export async function normalizeEnrichmentData(
  source: OrganizationEnrichmentSource,
  data: IOrganizationEnrichmentData,
): Promise<IOrganizationEnrichmentDataNormalized> {
  const service = OrganizationEnrichmentSourceServiceFactory.getEnrichmentSourceService(
    source,
    svc.log,
  )
  return service.normalize(data)
}

export async function applyEnrichmentToOrganization(
  organizationId: string,
  data: IOrganizationEnrichmentDataNormalized,
): Promise<void> {
  const qx = dbStoreQx(svc.postgres.writer)
  const orgData = await findOrgById(qx, organizationId, [
    OrganizationField.ID,
    OrganizationField.DISPLAY_NAME,
    OrganizationField.IS_TEAM_ORGANIZATION,
    OrganizationField.MANUALLY_CREATED,
  ])

  const existingAttributes = await findOrgAttributes(qx, organizationId)

  const prepared = prepareOrganizationData(
    // organization attributes are expected to be flattened
    { identities: data.identities, displayName: data.displayName, ...data.attributes },
    OrganizationAttributeSource.ENRICHMENT,
    orgData,
    existingAttributes,
  )

  await svc.postgres.writer.transactionally(async (t) => {
    const txQe = dbStoreQx(t)
    await updateOrganization(txQe, organizationId, prepared.organization)
    await upsertOrgAttributes(txQe, organizationId, prepared.attributes)
    await upsertOrgIdentities(txQe, organizationId, data.identities)
  })
}
