import {
  EDITION,
  IS_DEV_ENV,
  IS_TEST_ENV,
  distinct,
  distinctBy,
  getSecondsTillEndOfMonth,
  renameKeys,
} from '@crowd/common'
import { Logger, getChildLogger } from '@crowd/logging'
import { RedisCache } from '@crowd/redis'
import {
  Edition,
  FeatureFlag,
  FeatureFlagRedisKey,
  IEnrichableOrganization,
  PLAN_LIMITS,
  PlatformType,
  TenantPlans,
} from '@crowd/types'
import { svc } from '../main'
import {
  IOrganizationData,
  IOrganizationIdentity,
  OrganizationRepository,
} from '../repos/organization.repo'
import { IPremiumTenantInfo, TenantRepository } from '../repos/tenant.repo'
import { isFeatureEnabled } from '@crowd/feature-flags'
import { ENRICHMENT_PLATFORM_PRIORITY } from '../types/common'
import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'

/* eslint-disable @typescript-eslint/no-explicit-any */

const MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION =
  IS_DEV_ENV || IS_TEST_ENV ? 10 : EDITION === Edition.LFX ? 500 : 100

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

export async function getApplicableTenants(
  page: number,
  lastId?: string,
): Promise<IPremiumTenantInfo[]> {
  const log = getChildLogger(getApplicableTenants.name, svc.log)

  log.debug('Getting applicable tenants!')
  const repo = new TenantRepository(svc.postgres.reader, svc.log)
  const tenants = await repo.getPremiumTenants(page, lastId)

  log.debug(`Got ${tenants.length} applicable tenants!`)

  return tenants
}

export async function hasTenantOrganizationEnrichmentEnabled(tenantId: string): Promise<boolean> {
  const log = getChildLogger(hasTenantOrganizationEnrichmentEnabled.name, svc.log, {
    tenantId,
  })

  const result = await isFeatureEnabled(
    FeatureFlag.TEMPORAL_ORGANIZATION_ENRICHMENT,
    async () => {
      return {
        tenantId,
      }
    },
    svc.unleash,
    svc.redis,
    5 * 60,
    tenantId,
  )

  log.debug({ tenantId, enabled: result }, 'Tenant organization enrichment enabled?')
  return result
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

    const toSpend = Math.min(remainingCredits, MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION)

    log.info(
      { tenantId: tenant.id },
      `Tenant has ${remainingCredits} credits left. Spending ${toSpend} credits.`,
    )
    return toSpend
  }

  if ([TenantPlans.Enterprise, TenantPlans.Scale].includes(tenant.plan)) {
    log.info(
      { tenantId: tenant.id },
      `Tenant has unlimited credits. Spending ${MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION} credits.`,
    )
    return MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION
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

/**
 * Fetch organizations ids that need to be enriched
 * This is those who have lastEnrichedAt set to null or they haven't been enriched in the last 3 months
 * @param tenantId
 * @param perPage
 * @param lastId
 * @returns
 */
export async function getTenantOrganizationsForEnrichment(
  tenantId: string,
  perPage: number,
  page: number,
): Promise<string[]> {
  const log = getChildLogger(getTenantOrganizationsForEnrichment.name, svc.log, { tenantId })
  const repo = new OrganizationRepository(svc.postgres.reader, svc.log)
  const organizationIds = await repo.getTenantOrganizationsToEnrich(tenantId, perPage, page)
  log.info({ tenantId, nrOrgs: organizationIds.length }, 'Got organizations for enrichment!')
  return organizationIds
}

/**
 * Attempts organization enrichment.
 * @param tenantId
 * @param organizationId
 * @returns true if organization was enriched, false otherwise
 */
export async function tryEnrichOrganization(
  tenantId: string,
  organizationId: string,
): Promise<boolean> {
  const log = getChildLogger(tryEnrichOrganization.name, svc.log, {
    tenantId,
    organizationId,
  })

  log.debug('Trying to enrich an organization!')

  const repo = new OrganizationRepository(svc.postgres.writer, log)

  const orgData = await repo.getOrganizationData(organizationId)

  if (!orgData) {
    log.warn('Organization not found!')
    return false
  }

  const identityPlatforms = distinct(orgData.identities.map((i) => i.platform))

  if (identityPlatforms.length > 0) {
    const platformsForEnrichment = ENRICHMENT_PLATFORM_PRIORITY.filter((p) =>
      identityPlatforms.includes(p),
    )

    if (platformsForEnrichment.length > 0 || orgData.website) {
      const platformToUseForEnrichment = platformsForEnrichment[0]
      const identityForEnrichment = orgData.identities.find(
        (i) => i.platform === platformToUseForEnrichment,
      )

      // we use website and identityForEnrichment?.name to enrich the organization
      const enrichmentData = await getEnrichment(
        {
          website: orgData.website,
          name: identityForEnrichment?.name,
        },
        log,
      )

      if (enrichmentData) {
        log.debug('Enrichment data found!')
        const finalData = convertEnrichedDataToOrg(enrichmentData, orgData.identities)
        finalData.weakIdentities = orgData.weakIdentities
        await prepareIdentities(orgData.tenantId, orgData.id, finalData, repo)

        let website: string | undefined
        let checkIfWebsiteIsTaken = false
        if (orgData.website && finalData.website && orgData.website !== finalData.website) {
          log.debug('Website changed!')
          website = finalData.website
          checkIfWebsiteIsTaken = true
        } else if (orgData.website) {
          website = orgData.website
        } else if (finalData.website) {
          log.debug('Website found!')
          website = finalData.website
          checkIfWebsiteIsTaken = true
        }

        if (
          checkIfWebsiteIsTaken &&
          repo.anyOtherOrganizationWithTheSameWebsite(orgData.id, orgData.tenantId, orgData.website)
        ) {
          log.debug('Website is already taken!')
          // we can't set this website in the database due to unique constraint but we can generate merge suggestions based on it
          finalData.website = undefined
        }

        await repo.transactionally(async (t) => {
          await t.updateIdentities(
            orgData.id,
            orgData.tenantId,
            orgData.identities,
            finalData.identities,
          )
          await t.updateOrganizationWithEnrichedData(orgData, finalData)

          if (website) {
            log.debug({ website }, 'Generating merge suggestions!')
            await t.generateMergeSuggestions(orgData.id, orgData.tenantId, website)
          }
        })

        log.debug('Enrichment done!')
      } else {
        log.debug('No enrichment data found!')
        await repo.markEnriched(organizationId)
      }

      return true
    } else {
      log.warn('Organization does not have a website and no identities with enrichment platforms!')
    }
  } else {
    log.warn('Organization has no activities or identities and therefore it will not be enriched!')
  }

  return false
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

/**
 * Fetch enrichment data from PDL Company API
 * @param enrichmentInput - The object that contains organization enrichment attributes
 * @returns the PDL company response
 */
async function getEnrichment({ name, website, locality }: any, log: Logger): Promise<any> {
  const PDLJSModule = await import('peopledatalabs')
  const PDLClient = new PDLJSModule.default({
    apiKey: process.env['CROWD_ORGANIZATION_ENRICHMENT_API_KEY'],
  })
  let data: null | any
  try {
    const payload: any = {}

    if (name) {
      payload.name = name
    }

    if (website) {
      payload.website = website
    }

    data = await PDLClient.company.enrichment(payload)

    if (data.website === 'undefined.es') {
      return null
    }

    data.name = name
  } catch (error) {
    if (error.status === 404) {
      log.debug({ name, website, locality }, 'PDL data not available!')
    } else {
      log.error(error, { name, website, locality }, 'Error while fetching PDL data!')
    }

    return null
  }
  return data
}

function convertEnrichedDataToOrg(pdlData: any, existingIdentities: IOrganizationIdentity[]): any {
  let data = <IEnrichableOrganization>renameKeys(pdlData, {
    summary: 'description',
    employee_count_by_country: 'employeeCountByCountry',
    employee_count: 'employees',
    location: 'address',
    tags: 'tags',
    ultimate_parent: 'ultimateParent',
    immediate_parent: 'immediateParent',
    affiliated_profiles: 'affiliatedProfiles',
    all_subsidiaries: 'allSubsidiaries',
    alternative_domains: 'alternativeDomains',
    alternative_names: 'alternativeNames',
    average_employee_tenure: 'averageEmployeeTenure',
    average_tenure_by_level: 'averageTenureByLevel',
    average_tenure_by_role: 'averageTenureByRole',
    direct_subsidiaries: 'directSubsidiaries',
    employee_churn_rate: 'employeeChurnRate',
    employee_count_by_month: 'employeeCountByMonth',
    employee_growth_rate: 'employeeGrowthRate',
    employee_count_by_month_by_level: 'employeeCountByMonthByLevel',
    employee_count_by_month_by_role: 'employeeCountByMonthByRole',
    gics_sector: 'gicsSector',
    gross_additions_by_month: 'grossAdditionsByMonth',
    gross_departures_by_month: 'grossDeparturesByMonth',
    inferred_revenue: 'inferredRevenue',
  })
  data = sanitize(data)

  data = enrichSocialNetworks(data, {
    profiles: pdlData.profiles,
    linkedin_id: pdlData.linkedin_id,
  })

  data.identities = existingIdentities

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

function sanitize(data: any): any {
  if (data.address) {
    data.geoLocation = data.address.geo ?? null
    delete data.address.geo
    data.location = `${data.address.street_address ?? ''} ${data.address.address_line_2 ?? ''} ${
      data.address.name ?? ''
    }`
  }
  if (data.employeeCountByCountry && !data.employees) {
    const employees = Object.values(data.employeeCountByCountry).reduce(
      (acc, size) => (acc as any) + size,
      0,
    )
    Object.assign(data, { employees: employees || data.employees })
  }
  if (data.description) {
    let description = data.description[0].toUpperCase()
    for (let char of data.description.slice(1)) {
      if (description.length > 1 && description.slice(-2) === '. ') {
        char = char.toUpperCase()
      }
      description += char
    }
    data.description = description
  }
  if (data.inferredRevenue) {
    const revenueList = data.inferredRevenue
      .replaceAll('$', '')
      .split('-')
      .map((x) => {
        // billions --> millions conversion, if needed
        const multiple = x.endsWith('B') ? 1000 : 1
        const value = parseInt(x, 10) * multiple
        return value
      })

    data.revenueRange = {
      min: revenueList[0],
      max: revenueList[1],
    }
  }

  return data
}

function enrichSocialNetworks(
  data: IEnrichableOrganization,
  socialNetworks: {
    profiles: any
    linkedin_id: any
  },
): IEnrichableOrganization {
  const socials = socialNetworks.profiles.reduce((acc, social) => {
    const platform = social.split('.')[0]
    const handle = social.split('/').splice(-1)[0]
    if (
      Object.values(PlatformType).includes(platform as any) &&
      handle !== socialNetworks.linkedin_id
    ) {
      acc[platform] = {
        handle,
        [platform === PlatformType.TWITTER ? 'site' : 'url']: social,
      }
    }
    return acc
  }, {})
  return { ...data, ...socials }
}
