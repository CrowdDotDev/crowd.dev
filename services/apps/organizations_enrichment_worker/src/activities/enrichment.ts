import { IS_DEV_ENV, IS_TEST_ENV, renameKeys } from '@crowd/common'
import { SearchSyncWorkerEmitter } from '@crowd/common_services'
import {
  ENRICHMENT_PLATFORM_PRIORITY,
  IDbOrgIdentity,
  IEnrichableOrganizationData,
  findOrgAttributes,
  findOrgById,
  getOrgIdentities,
  getOrgIdsToEnrich,
  markOrganizationEnriched,
  prepareOrganizationData,
  updateOrganization,
  upsertOrgAttributes,
  upsertOrgIdentities,
} from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { Logger, getChildLogger } from '@crowd/logging'
import {
  IOrganizationIdentity,
  OrganizationAttributeSource,
  OrganizationIdentityType,
  PlatformType,
} from '@crowd/types'

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

  searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(svc.queue, svc.log)

  await searchSyncWorkerEmitter.init()

  return searchSyncWorkerEmitter
}

export async function syncToOpensearch(organizationId: string): Promise<void> {
  const log = getChildLogger(syncToOpensearch.name, svc.log, {
    organizationId,
  })

  try {
    const searchSyncWorkerEmitter = await getSearchSyncWorkerEmitter()
    await searchSyncWorkerEmitter.triggerOrganizationSync(organizationId, false)
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

  const orgs = await getOrgIdsToEnrich(dbStoreQx(svc.postgres.reader), perPage, page)

  log.info({ nrOrgs: orgs.length }, 'Fetched organizations to enrich!')

  return orgs
}

/**
 * Attempts organization cache enrichment.
 * @param cacheId
 * @returns true if organization was enriched, false otherwise
 */
export async function tryEnrichOrganization(organizationId: string): Promise<boolean> {
  const log = getChildLogger(tryEnrichOrganization.name, svc.log, {
    organizationId,
  })

  log.debug('Trying to enrich an organization!')

  const qe = dbStoreQx(svc.postgres.reader)

  const data = await findOrgById(qe, organizationId)

  if (!data) {
    log.warn('Organization not found!')
    return false
  }

  const identities = await getOrgIdentities(qe, organizationId)

  const verifiedIdentities = identities.filter((i) => i.verified)

  const primaryDomainIdentities = verifiedIdentities.filter(
    (i) => i.type === OrganizationIdentityType.PRIMARY_DOMAIN,
  )

  if (primaryDomainIdentities.length === 0) {
    log.warn('Organization does not have a website!')
    return false
  }

  if (primaryDomainIdentities.length > 1) {
    log.warn('Organization has multiple primary domains!')
    return false
  }

  const primaryDomainIdentity = primaryDomainIdentities[0]

  let nameToUseForEnrichment: string | undefined
  for (const platform of ENRICHMENT_PLATFORM_PRIORITY) {
    const identities = verifiedIdentities.filter(
      (i) => i.platform === platform && i.type === OrganizationIdentityType.USERNAME,
    )
    if (identities.length > 0) {
      nameToUseForEnrichment = identities[0].value
      break
    }
  }

  const enrichmentData = await getEnrichment(
    {
      website: primaryDomainIdentity.value,
      name: nameToUseForEnrichment,
    },
    log,
  )

  if (enrichmentData) {
    log.debug('Enrichment data found!')

    const finalData = convertEnrichedDataToOrg(enrichmentData, identities)
    const attributes = await findOrgAttributes(qe, organizationId)
    const prepared = prepareOrganizationData(
      finalData,
      OrganizationAttributeSource.PDL,
      data,
      attributes,
    )

    await svc.postgres.writer.transactionally(async (t) => {
      const txQe = dbStoreQx(t)
      await updateOrganization(txQe, organizationId, prepared.organization)
      await upsertOrgAttributes(txQe, organizationId, prepared.attributes)
      await upsertOrgIdentities(txQe, organizationId, finalData.identities)
    })

    log.debug('Enrichment done!')
    return true
  } else {
    log.debug('No enrichment data found!')
    await markOrganizationEnriched(qe, organizationId)
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

function convertEnrichedDataToOrg(pdlData: any, existingIdentities: IOrganizationIdentity[]): any {
  let enriched = renameKeys(pdlData, {
    summary: 'description',
    employee_count_by_country: 'employeeCountByCountry',
    employee_count: 'employees',
    location: 'address',
    tags: 'tags',
    ultimate_parent: 'ultimateParent',
    immediate_parent: 'immediateParent',
    all_subsidiaries: 'allSubsidiaries',
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
  enriched = sanitize(enriched)

  enriched.identities = existingIdentities
  for (const domain of pdlData.alternative_domains || []) {
    if (
      enriched.identities.find(
        (i) =>
          i.type === OrganizationIdentityType.ALTERNATIVE_DOMAIN &&
          i.platform === 'enrichment' &&
          i.value === domain,
      ) === undefined
    ) {
      enriched.identities.push({
        type: OrganizationIdentityType.ALTERNATIVE_DOMAIN,
        platform: 'enrichment',
        value: domain,
        verified: false,
      })
    }
  }

  if ((enriched as any).website) {
    if (
      enriched.identities.find(
        (i) =>
          i.type === OrganizationIdentityType.PRIMARY_DOMAIN &&
          i.value === (enriched as any).website,
      ) === undefined
    ) {
      enriched.identities.push({
        type: OrganizationIdentityType.PRIMARY_DOMAIN,
        platform: 'enrichment',
        value: (enriched as any).website,
        verified: false,
      })
    }
  }

  for (const profile of pdlData.affiliated_profiles || []) {
    if (
      enriched.identities.find(
        (i) =>
          i.type === OrganizationIdentityType.AFFILIATED_PROFILE &&
          i.platform === 'enrichment' &&
          i.value === profile,
      ) === undefined
    ) {
      enriched.identities.push({
        type: OrganizationIdentityType.AFFILIATED_PROFILE,
        platform: 'enrichment',
        value: profile,
        verified: false,
      })
    }
  }

  enriched.identities = enrichSocialNetworks(enriched.identities, {
    profiles: pdlData.profiles,
    linkedin_id: pdlData.linkedin_id,
  })

  const data: any = {
    ...enriched,
  }

  // Set displayName using the first identity or fallback to website
  if (!data.displayName) {
    const verifiedIdentities = data.identities.filter((i) => i.verified)
    if (verifiedIdentities.length > 0) {
      data.displayName = verifiedIdentities[0].value
    }
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
  identities: IDbOrgIdentity[],
  socialNetworks: {
    profiles: string[]
    linkedin_id: string
  },
): IDbOrgIdentity[] {
  for (const social of socialNetworks.profiles) {
    let handle = social.split('/').splice(-1)[0]

    if (handle === socialNetworks.linkedin_id) {
      continue
    }

    let platform: string | undefined
    for (const p of [
      PlatformType.TWITTER,
      PlatformType.LINKEDIN,
      PlatformType.GITHUB,
      PlatformType.CRUNCHBASE,
    ]) {
      if (social.includes(platform)) {
        platform = p
        break
      }
    }

    if (!platform) {
      continue
    }

    if (platform === PlatformType.LINKEDIN) {
      if (social.includes('company')) {
        handle = `company:${handle}`
      } else if (social.includes('school')) {
        handle = `school:${handle}`
      } else if (social.includes('showcase')) {
        handle = `showcase:${handle}`
      }
    }

    if (
      identities.find(
        (i) =>
          i.platform === platform &&
          i.value === handle &&
          i.type === OrganizationIdentityType.USERNAME,
      ) === undefined
    ) {
      identities.push({
        platform,
        value: handle,
        type: OrganizationIdentityType.USERNAME,
        verified: false,
      })
    }
  }

  return identities
}
