import { IS_DEV_ENV, IS_TEST_ENV, distinctBy, renameKeys } from '@crowd/common'
import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/premium/organization_enrichment_worker/organization.repo'
import {
  ENRICHMENT_PLATFORM_PRIORITY,
  IEnrichableOrganizationData,
  IOrganizationData,
} from '@crowd/data-access-layer/src/old/apps/premium/organization_enrichment_worker/types'
import { Logger, getChildLogger } from '@crowd/logging'
import { IEnrichableOrganization, IOrganizationIdentity, PlatformType } from '@crowd/types'
import { svc } from '../main'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION = IS_DEV_ENV || IS_TEST_ENV ? 10 : 500

export async function getMaxEnrichedOrganizationsPerExecution(): Promise<number> {
  return MAX_ENRICHED_ORGANIZATIONS_PER_EXECUTION
}

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

export async function getOrganizationsToEnrich(
  perPage: number,
  page: number,
): Promise<IEnrichableOrganizationData[]> {
  const log = getChildLogger(getOrganizationsToEnrich.name, svc.log, {
    perPage,
    page,
  })

  const repo = new OrganizationRepository(svc.postgres.reader, log)

  const orgs = await repo.getOrganizationsToEnrich(perPage, page)

  log.info({ nrOrgs: orgs.length }, 'Fetched organizations to enrich!')

  return orgs
}

/**
 * Attempts organization cache enrichment.
 * @param tenantId
 * @param cacheId
 * @returns true if organization was enriched, false otherwise
 */
export async function tryEnrichOrganization(organizationId: string): Promise<boolean> {
  const log = getChildLogger(tryEnrichOrganization.name, svc.log, {
    organizationId,
  })

  log.debug('Trying to enrich an organization!')

  const repo = new OrganizationRepository(svc.postgres.writer, log)
  const data = await repo.getOrganizationData(organizationId)

  if (!data) {
    log.warn('Organization not found!')
    return false
  }

  if (data.website === undefined || data.website === null || data.website.trim().length === 0) {
    log.warn('Organization does not have a website!')
    return false
  }

  const identityPlatforms = []
  for (const platform of ENRICHMENT_PLATFORM_PRIORITY) {
    if (data[platform] && data[platform].handle) {
      identityPlatforms.push({
        platform,
        name: data[platform].handle,
      })
    }
  }

  if (identityPlatforms.length > 0) {
    const nameToUseForEnchment = identityPlatforms[0].name
    const enrichmentData = await getEnrichment(
      {
        website: data.website,
        name: nameToUseForEnchment,
      },
      log,
    )

    if (enrichmentData) {
      log.debug('Enrichment data found!')

      const finalData = convertEnrichedDataToOrg(enrichmentData, data.identities)
      finalData.weakIdentities = data.weakIdentities
      await prepareIdentities(data.tenantId, data.id, finalData, repo)

      let checkIfWebsiteIsTaken = false
      if (data.website && finalData.website && data.website !== finalData.website) {
        log.debug('Website changed!')
        checkIfWebsiteIsTaken = true
      } else if (!data.website && finalData.website) {
        log.debug('Website found!')
        checkIfWebsiteIsTaken = true
      }

      if (
        checkIfWebsiteIsTaken &&
        repo.anyOtherOrganizationWithTheSameWebsite(data.id, data.tenantId, data.website)
      ) {
        log.debug('Website is already taken!')
        finalData.website = undefined
      }

      await repo.transactionally(async (t) => {
        await t.updateIdentities(data.id, data.tenantId, data.identities, finalData.identities)
        await t.updateOrganizationWithEnrichedData(data, finalData)
      })

      log.debug('Enrichment done!')
      return true
    } else {
      log.debug('No enrichment data found!')
      await repo.markOrganizationEnriched(organizationId)
    }
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

function convertEnrichedDataToOrg(pdlData: any, existingIdentities: IOrganizationIdentity[]): any {
  let enrichemntData = <IEnrichableOrganization>renameKeys(pdlData, {
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
  enrichemntData = sanitize(enrichemntData)

  enrichemntData = enrichSocialNetworks(enrichemntData, {
    profiles: pdlData.profiles,
    linkedin_id: pdlData.linkedin_id,
  })

  const data: any = {
    ...enrichemntData,
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
