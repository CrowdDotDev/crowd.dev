import { distinct, getSecondsTillEndOfMonth, renameKeys } from '@crowd/common'
import { getChildLogger } from '@crowd/logging'
import { RedisCache } from '@crowd/redis'
import {
  FeatureFlag,
  FeatureFlagRedisKey,
  IEnrichableOrganization,
  PLAN_LIMITS,
  PlatformType,
  TenantPlans,
} from '@crowd/types'
import { EnrichmentParams, IEnrichmentResponse } from '@crowd/types/premium'
import { pick } from 'lodash.pick'
import { svc } from '../main'
import { OrganizationRepository } from '../repos/organization.repo'
import { IPremiumTenantInfo } from '../repos/tenant.repo'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Calculate how many credits the tenant has left for organization enrichment
 * @param tenant
 * @returns number of credits left for the tenant that can be used to enrich organizations
 */
export async function getTenantCredits(tenant: IPremiumTenantInfo): Promise<number> {
  const log = getChildLogger('getTenantCredits', svc.log, { tenantId: tenant.id })
  if (tenant.plan === TenantPlans.Growth) {
    // need to check how many credits the tenant has left
    const cache = new RedisCache(FeatureFlagRedisKey.ORGANIZATION_ENRICHMENT_COUNT, svc.redis, log)
    const usedCredits = parseInt((await cache.get(tenant.id)) ?? '0', 10)
    const remainingCredits =
      PLAN_LIMITS[TenantPlans.Growth][FeatureFlag.ORGANIZATION_ENRICHMENT] - usedCredits

    log.debug({ tenantId: tenant.id }, `Tenant has ${remainingCredits} credits left.`)
    return remainingCredits
  }

  if ([TenantPlans.Enterprise, TenantPlans.Scale].includes(tenant.plan)) {
    log.debug({ tenantId: tenant.id }, `Tenant has unlimited credits.`)
    return -1
  }

  throw new Error(`Only premium tenant plans are supported - got ${tenant.plan}!`)
}

/**
 * Decrement tenant organization enrichment credits by 1
 * @param tenantId
 */
export async function decrementTenantCredits(tenantId: string): Promise<void> {
  const log = getChildLogger('decrementTenantCredits', svc.log, { tenantId })

  log.debug({ tenantId }, `Decrementing tenant credits.`)
  const cache = new RedisCache(FeatureFlagRedisKey.ORGANIZATION_ENRICHMENT_COUNT, svc.redis, log)

  await cache.decrement(tenantId, 1, getSecondsTillEndOfMonth())
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
  lastId?: string,
): Promise<string[]> {
  const repo = new OrganizationRepository(svc.postgres.reader, svc.log)
  const organizationIds = await repo.getTenantOrganizationsToEnrich(tenantId, perPage, lastId)
  return organizationIds
}

const ENRICHMENT_PLATFORM_PRIORITY = [
  PlatformType.GITHUB,
  PlatformType.LINKEDIN,
  PlatformType.TWITTER,
]

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
  const log = getChildLogger('tryEnrichOrganization', svc.log, {
    tenantId,
    organizationId,
  })

  log.debug('Trying to enrich an organization!')

  const repo = new OrganizationRepository(svc.postgres.reader, log)

  const orgData = await repo.getOrganizationData(organizationId)

  if (!orgData) {
    log.warn('Organization not found!')
    return false
  }

  const identityPlatforms = distinct(orgData.identities.map((i) => i.platform))

  if (orgData.orgActivityCount > 0 && identityPlatforms.length > 0) {
    const platformsForEnrichment = ENRICHMENT_PLATFORM_PRIORITY.filter((p) =>
      identityPlatforms.includes(p),
    )

    if (platformsForEnrichment.length > 0 || orgData.website) {
      const platformToUseForEnrichment = platformsForEnrichment[0]
      const identityForEnrichment = orgData.identities.find(
        (i) => i.platform === platformToUseForEnrichment,
      )

      // we use website and identityForEnrichment?.name to enrich the organization
      const enrichmentData = await getEnrichment({
        website: orgData.website,
        name: identityForEnrichment?.name,
      })

      if (enrichmentData) {
        const finalData = convertEnrichedDataToOrg(enrichmentData, orgData)
        // TODO save final data to the database by updating the organizations row
      } else {
        log.debug('No enrichment data found!')
        await repo.markEnriched(organizationId)
      }

      return true
    } else {
      log.warn('Organization does not have a website and no identities with enrichment platforms!')
      return false
    }
  } else {
    log.warn('Organization has no activities or identities and therefore it will not be enriched!')
    return false
  }

  // return false
}

/**
 * Fetch enrichment data from PDL Company API
 * @param enrichmentInput - The object that contains organization enrichment attributes
 * @returns the PDL company response
 */
async function getEnrichment({ name, website, locality }: EnrichmentParams): Promise<any> {
  const PDLJSModule = await import('peopledatalabs')
  const PDLClient = new PDLJSModule.default({ apiKey: this.apiKey })
  let data: null | IEnrichmentResponse
  try {
    const payload: Partial<EnrichmentParams> = {}

    if (name) {
      payload.name = name
    }

    if (website) {
      payload.website = website
    }

    data = await PDLClient.company.enrichment(payload as EnrichmentParams)

    if (data.website === 'undefined.es') {
      return null
    }

    data.name = name
  } catch (error) {
    this.options.log.error({ name, website, locality }, 'PDL Data Unavalable', error)
    return null
  }
  return data
}

function convertEnrichedDataToOrg(
  pdlData: Awaited<IEnrichmentResponse>,
  instance: IEnrichableOrganization,
): any {
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

  data.identities = instance.identities

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

  return pick(
    data,
    Object.keys(instance).forEach((field) => this.fields.add(field)),
  )
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
    profiles: IEnrichmentResponse['profiles']
    linkedin_id: IEnrichmentResponse['linkedin_id']
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
