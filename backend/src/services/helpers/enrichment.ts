import { CLEARBIT_CONFIG, IS_TEST_ENV } from '../../conf'

interface enrichedOrganization {
  name: string
  url: string
  description: string | null
  parentUrl: string | null
  emails: string[]
  phoneNumbers: string[]
  logo: string | null
  tags: string[]
  twitter: null | {
    handle: string
    id: string
    followers: number
    following: number
    bio: string
    location: string
    site: string
    avatar: string
  }
  linkedin: null | {
    handle: string
  }
  crunchbase: null | {
    handle: string
  }
  employees: number | null
  revenueRange: {
    min: number
    max: number
  }
}

function parseOrganization(res) {
  const revenueList = res.metrics.estimatedAnnualRevenue
    .replaceAll('$', '')
    .replaceAll('M', '')
    .split('-')
    .map((x) => parseInt(x, 10))
  return {
    url: res.domain,
    name: res.name,
    description: res.description,
    parentUrl: res.parent.domain,
    emails: res.site.emailAddresses,
    phoneNumbers: res.site.phoneNumbers,
    logo: res.logo,
    tags: res.tags,
    twitter: res.twitter,
    linkedin: res.linkedin,
    crunchbase: res.crunchbase,
    employees: res.metrics.employees,
    revenueRange: {
      min: revenueList[0],
      max: revenueList[1],
    },
  }
}

/**
 * Enrich data from an organization
 * @param url The URL of the organization
 * @returns The enriched organization
 */
export async function enrichOrganization(url: string): Promise<enrichedOrganization> {
  let out
  // If we are testing we don't want to make real requests
  if (IS_TEST_ENV) {
    const fs = require('fs')
    out = JSON.parse(
      fs.readFileSync('./src/services/helpers/__tests__/enrichment-mocks/company.json'),
    )
  } else {
    const clearbit = require('clearbit')(CLEARBIT_CONFIG.apiKey)
    out = await clearbit.Company.find({ domain: url })
  }
  return parseOrganization(out)
}

/**
 * Enrich a person with their organization
 * @param email The email of the person
 * @returns The enriched person and the organization
 */
export async function enrichPerson(email: string): Promise<any> {
  let out
  // If we are testing we don't want to make real requests
  if (IS_TEST_ENV) {
    const fs = require('fs')
    out = JSON.parse(
      fs.readFileSync('./src/services/helpers/__tests__/enrichment-mocks/person.json'),
    )
  } else {
    const clearbit = require('clearbit')(CLEARBIT_CONFIG.apiKey)
    out = await clearbit.Enrichment.find({ email, stream: true })
  }
  return out
}

/**
 * Get the URL of an organization from its name
 * @param name The name of the organization
 * @returns The URL of the organization, or null if not found
 */
export async function organizationUrlFromName(name: string): Promise<string | null> {
  if (IS_TEST_ENV) {
    return 'https://crowd.dev'
  }
  try {
    // There is no SDK function for this. We have to use the API directly.
    const axios = require('axios')
    const response = await axios.get('https://company.clearbit.com/v1/domains/find', {
      params: {
        name,
      },
      auth: {
        username: CLEARBIT_CONFIG.apiKey,
      },
    })
    return response.data.domain
  } catch (e) {
    return null
  }
}
