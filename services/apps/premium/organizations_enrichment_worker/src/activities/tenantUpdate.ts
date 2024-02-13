import { distinctBy, getSecondsTillEndOfMonth } from '@crowd/common'
import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { getChildLogger } from '@crowd/logging'
import { RedisCache } from '@crowd/redis'
import {
  FeatureFlag,
  FeatureFlagRedisKey,
  PLAN_LIMITS,
  PlatformType,
  TenantPlans,
} from '@crowd/types'
import { svc } from '../main'
import { OrganizationRepository } from '../repos/organization.repo'
import {
  IOrganizationCacheData,
  IOrganizationData,
  IOrganizationIdentity,
  IPremiumTenantInfo,
} from '../types/common'
import { MAX_ENRICHED_ORGANIZATION_CACHES_PER_EXECUTION } from './enrichment'

/* eslint-disable @typescript-eslint/no-explicit-any */

let searchSyncWorkerEmitter: SearchSyncWorkerEmitter | undefined
async function getSearchSyncWorkerEmitter(): Promise<SearchSyncWorkerEmitter> {
  if (searchSyncWorkerEmitter) {
    if (!searchSyncWorkerEmitter.isInitialized()) {
      await searchSyncWorkerEmitter.init()
    }

    return searchSyncWorkerEmitter
  }

  const repo = new PriorityLevelContextRepository(svc.postgres.reader, svc.log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    repo.loadPriorityLevelContext(tenantId)

  searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(
    svc.sqs,
    svc.redis,
    svc.tracer,
    svc.unleash,
    loader,
    svc.log,
  )

  await searchSyncWorkerEmitter.init()

  return searchSyncWorkerEmitter
}

export async function syncToOpensearch(tenantId: string, organizationId: string): Promise<void> {
  const log = getChildLogger(syncToOpensearch.name, svc.log, {
    organizationId,
  })

  try {
    const searchSyncWorkerEmitter = await getSearchSyncWorkerEmitter()
    await searchSyncWorkerEmitter.triggerOrganizationSync(tenantId, organizationId, false)
  } catch (err) {
    log.error(err, 'Error while syncing organization to OpenSearch!')
    throw new Error(err)
  }

  return null
}

export async function getApplicableTenants(): Promise<IPremiumTenantInfo[]> {
  const log = getChildLogger(getApplicableTenants.name, svc.log)

  log.debug('Getting applicable tenants!')
  const repo = new OrganizationRepository(svc.postgres.reader, svc.log)
  const tenants = await repo.getPremiumTenants()

  log.debug(`Got ${tenants.length} applicable tenants!`)

  return tenants
}

/**
 * Calculate how many credits the tenant has left for organization enrichment
 * @param tenant
 * @returns number of credits left for the tenant that can be used to enrich organizations
 */
export async function getRemainingTenantCredits(tenant: IPremiumTenantInfo): Promise<number> {
  const log = getChildLogger(getRemainingTenantCredits.name, svc.log, { tenantId: tenant.id })
  if (tenant.plan === TenantPlans.Growth) {
    // need to check how many credits the tenant has left
    const cache = new RedisCache(FeatureFlagRedisKey.ORGANIZATION_ENRICHMENT_COUNT, svc.redis, log)
    const cached = await cache.get(tenant.id)
    if (!cached) {
      await cache.set(tenant.id, '0', getSecondsTillEndOfMonth())
    }
    const usedCredits = parseInt(cached ?? '0', 10)
    const remainingCredits =
      PLAN_LIMITS[TenantPlans.Growth][FeatureFlag.ORGANIZATION_ENRICHMENT] - usedCredits

    const toSpend = Math.min(remainingCredits, MAX_ENRICHED_ORGANIZATION_CACHES_PER_EXECUTION)

    log.info(
      { tenantId: tenant.id },
      `Tenant has ${remainingCredits} credits left. Spending ${toSpend} credits.`,
    )
    return toSpend
  }

  if ([TenantPlans.Enterprise, TenantPlans.Scale].includes(tenant.plan)) {
    log.info(
      { tenantId: tenant.id },
      `Tenant has unlimited credits. Spending ${MAX_ENRICHED_ORGANIZATION_CACHES_PER_EXECUTION} credits.`,
    )
    return MAX_ENRICHED_ORGANIZATION_CACHES_PER_EXECUTION
  }

  throw new Error(`Only premium tenant plans are supported - got ${tenant.plan}!`)
}

/**
 * Increment tenant organization enrichment credits by 1
 * @param tenantId
 */
export async function incrementTenantCredits(tenantId: string, plan: TenantPlans): Promise<void> {
  const log = getChildLogger(incrementTenantCredits.name, svc.log, { tenantId })

  if (plan === TenantPlans.Growth) {
    log.debug({ tenantId }, `Incrementing tenant credits.`)
    const cache = new RedisCache(FeatureFlagRedisKey.ORGANIZATION_ENRICHMENT_COUNT, svc.redis, log)

    await cache.increment(tenantId, 1, getSecondsTillEndOfMonth())
  }
}

export async function updateTenantOrganization(
  tenantId: string,
  organizationId: string,
  organizationCacheId: string,
): Promise<boolean> {
  const log = getChildLogger(updateTenantOrganization.name, svc.log, {
    tenantId,
    organizationId,
    organizationCacheId,
  })
  log.debug('Updating tenant organization!')

  const repo = new OrganizationRepository(svc.postgres.writer, log)
  const cacheData = await repo.getOrganizationCacheData(organizationCacheId)
  const orgData = await repo.getOrganizationData(organizationId)

  if (orgData) {
    const preparedData = processCacheData(cacheData, orgData.identities)
    preparedData.weakIdentities = orgData.weakIdentities
    await prepareIdentities(orgData.tenantId, orgData.id, preparedData, repo)

    let website: string | undefined
    let checkIfWebsiteIsTaken = false
    if (orgData.website && preparedData.website && orgData.website !== preparedData.website) {
      log.debug('Website changed!')
      website = preparedData.website
      checkIfWebsiteIsTaken = true
    } else if (orgData.website) {
      website = orgData.website
    } else if (preparedData.website) {
      log.debug('Website found!')
      website = preparedData.website
      checkIfWebsiteIsTaken = true
    }

    if (
      checkIfWebsiteIsTaken &&
      repo.anyOtherOrganizationWithTheSameWebsite(orgData.id, orgData.tenantId, orgData.website)
    ) {
      log.debug('Website is already taken!')
      // we can't set this website in the database due to unique constraint but we can generate merge suggestions based on it
      preparedData.website = undefined
    }

    await repo.transactionally(async (t) => {
      await t.updateIdentities(
        orgData.id,
        orgData.tenantId,
        orgData.identities,
        preparedData.identities,
      )
      await t.updateOrganizationWithEnrichedData(orgData, preparedData)

      if (website) {
        log.debug({ website }, 'Generating merge suggestions!')
        await t.generateMergeSuggestions(orgData.id, orgData.tenantId, website)
      }
    })

    return true
  }

  return false
}

function processCacheData(
  cacheData: IOrganizationCacheData,
  existingIdentities: IOrganizationIdentity[],
): any {
  const data: any = {
    ...cacheData,
    identities: existingIdentities,
  }

  if (data.github && data.github.handle) {
    const identityExists = data.identities.find(
      (i) => i.platform === PlatformType.GITHUB && i.name === data.github.handle,
    )
    if (!identityExists) {
      data.identities.push({
        name: data.github.handle,
        platform: PlatformType.GITHUB,
        url: data.github.url || `https://github.com/${data.github.handle}`,
      })
    }
  }

  if (data.twitter && data.twitter.handle) {
    const identityExists = data.identities.find(
      (i) => i.platform === PlatformType.TWITTER && i.name === data.twitter.handle,
    )
    if (!identityExists) {
      data.identities.push({
        name: data.twitter.handle,
        platform: PlatformType.TWITTER,
        url: data.twitter.url || `https://twitter.com/${data.twitter.handle}`,
      })
    }
  }

  if (data.linkedin && data.linkedin.handle) {
    const identityExists = data.identities.find(
      (i) => i.platform === PlatformType.LINKEDIN && i.name === data.linkedin.handle,
    )
    if (!identityExists) {
      data.identities.push({
        name: data.linkedin.handle,
        platform: PlatformType.LINKEDIN,
        url: data.linkedin.url || `https://linkedin.com/company/${data.linkedin.handle}`,
      })
    }
  }

  // Set displayName using the first identity or fallback to website
  if (!data.displayName) {
    const identity = data.identities[0]
    data.displayName = identity ? identity.name : data.website
  }

  return data
}

async function prepareIdentities(
  tenantId: string,
  organizationId: string,
  orgData: IOrganizationData,
  repo: OrganizationRepository,
): Promise<void> {
  // find identities belonging to other orgs that match the ones in the orgData identities and weakIdentities
  const allIdentities = orgData.identities.concat(orgData.weakIdentities)
  let existingIdentities = await repo.findIdentities(tenantId, organizationId, allIdentities)
  existingIdentities = distinctBy(existingIdentities, (i) => `${i.platform}:${i.name}`)

  const weakIdentities: IOrganizationIdentity[] = []
  const identities: IOrganizationIdentity[] = []

  for (const identity of allIdentities) {
    // check if any other org has this identity
    if (
      existingIdentities.find((i) => i.platform === identity.platform && i.name === identity.name)
    ) {
      // this identity should be a weak one because some other org has this identity as well
      weakIdentities.push(identity)
    } else {
      // this identity should be a strong one because no other org has this identity
      identities.push(identity)
    }
  }

  // set it
  orgData.identities = identities
  orgData.weakIdentities = weakIdentities
}
