import { EDITION, IS_DEV_ENV, IS_TEST_ENV, renameKeys } from '@crowd/common'
import { Logger, getChildLogger } from '@crowd/logging'
import { Edition, IEnrichableOrganization, PlatformType } from '@crowd/types'
import { svc } from '../main'
import { OrganizationRepository } from '../repos/organization.repo'
import { ENRICHMENT_PLATFORM_PRIORITY, IEnrichableOrganizationCache } from '../types/common'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const MAX_ENRICHED_ORGANIZATION_CACHES_PER_EXECUTION =
  IS_DEV_ENV || IS_TEST_ENV ? 10 : EDITION === Edition.LFX ? 500 : 100

export async function getMaxEnrichedOrganizationCachesPerExecution(): Promise<number> {
  return MAX_ENRICHED_ORGANIZATION_CACHES_PER_EXECUTION
}

export async function getOrganizationCachesToEnrich(
  perPage: number,
  page: number,
): Promise<IEnrichableOrganizationCache[]> {
  const log = getChildLogger(getOrganizationCachesToEnrich.name, svc.log, {
    perPage,
    page,
  })

  const repo = new OrganizationRepository(svc.postgres.reader, log)

  const caches = await repo.getOrganizationCachesToEnrich(perPage, page)

  log.info({ nrCaches: caches.length }, 'Fetched organization caches to enrich!')

  return caches
}

/**
 * Attempts organization cache enrichment.
 * @param tenantId
 * @param cacheId
 * @returns true if organization was enriched, false otherwise
 */
export async function tryEnrichOrganizationCache(cacheId: string): Promise<boolean> {
  const log = getChildLogger(tryEnrichOrganizationCache.name, svc.log, {
    cacheId,
  })

  log.debug('Trying to enrich an organization cache!')

  const repo = new OrganizationRepository(svc.postgres.writer, log)
  const cacheData = await repo.getOrganizationCacheData(cacheId)

  if (!cacheData) {
    log.warn('Organization cache not found!')
    return false
  }

  const identityPlatforms = []
  for (const platform of ENRICHMENT_PLATFORM_PRIORITY) {
    if (cacheData[platform] && cacheData[platform].handle) {
      identityPlatforms.push({
        platform,
        name: cacheData[platform].handle,
      })
    }
  }

  const identityWithWebsite = cacheData.identities.find((i) => i.website !== null)

  if (identityPlatforms.length > 0 || identityWithWebsite !== undefined) {
    const nameToUseForEnchment = identityPlatforms[0].name
    const enrichmentData = await getEnrichment(
      {
        website: identityWithWebsite?.website,
        name: nameToUseForEnchment,
      },
      log,
    )

    if (enrichmentData) {
      log.debug('Enrichment data found!')

      const finalData = convertEnrichedDataToOrg(enrichmentData)

      await repo.transactionally(async (t) => {
        await t.updateOrganizationCacheWithEnrichedData(cacheData, finalData)
      })

      log.debug('Enrichment done!')
    } else {
      log.debug('No enrichment data found!')
      await repo.markOrganizationCacheEnriched(cacheId)
    }

    return true
  } else {
    log.warn('Organization does not have a website and no identities with enrichment platforms!')
  }

  return false
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

function convertEnrichedDataToOrg(pdlData: any): any {
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
