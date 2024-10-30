import axios from 'axios'

import { Logger, LoggerBase } from '@crowd/logging'
import { MemberEnrichmentSource, MemberIdentityType, PlatformType } from '@crowd/types'

import {
  IEnrichmentService,
  IEnrichmentSourceInput,
  IMemberEnrichmentDataNormalized,
} from '../../types'

import { IMemberEnrichmentDataSerp, IMemberEnrichmentSerpApiResponse } from './types'

export default class EnrichmentServiceSerpApi extends LoggerBase implements IEnrichmentService {
  public source: MemberEnrichmentSource = MemberEnrichmentSource.SERP
  public platform = `enrichment-${this.source}`

  public enrichableBySql = `
  (members."displayName" like '% %') AND 
  (members.attributes->'location'->>'default' is not null and members.attributes->'location'->>'default' <> '') AND
  ((members.attributes->'websiteUrl'->>'default' is not null and members.attributes->'websiteUrl'->>'default' <> '') OR 
   (mi.verified AND mi.type = 'username' and mi.platform = 'github') OR 
   (mi.verified AND mi.type = 'email')
  )`

  // bust cache after 60 days
  public cacheObsoleteAfterSeconds = 60 * 60 * 24 * 60

  constructor(public readonly log: Logger) {
    super(log)
  }

  isEnrichableBySource(input: IEnrichmentSourceInput): boolean {
    const displayNameSplit = input.displayName?.split(' ')
    return (
      displayNameSplit?.length > 1 &&
      !!input.location &&
      ((!!input.email && input.email.verified) ||
        (!!input.github && input.github.verified) ||
        !!input.website)
    )
  }

  async getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentDataSerp | null> {
    let enriched: IMemberEnrichmentDataSerp = null

    if (input.displayName && input.location && input.website) {
      enriched = await this.queryWithWebsite(input.displayName, input.location, input.website)
    }

    if (!enriched && input.displayName && input.location && input.github) {
      enriched = await this.queryWithGithubIdentity(
        input.displayName,
        input.location,
        input.github.value,
      )
    }

    if (!enriched && input.displayName && input.location && input.email) {
      enriched = await this.queryWithEmail(input.displayName, input.location, input.email.value)
    }
    return enriched
  }

  private async queryWithWebsite(
    displayName: string,
    location: string,
    website: string,
  ): Promise<IMemberEnrichmentDataSerp> {
    const url = `https://serpapi.com/search.json`

    const config = {
      method: 'get',
      url,
      params: {
        api_key: process.env['CROWD_SERP_API_KEY'],
        q: `"${displayName}" ${location} "${website}" site:linkedin.com/in`,
        num: 3,
        engine: 'google',
      },
    }

    const response: IMemberEnrichmentSerpApiResponse = (await axios(config)).data

    if (response.search_information.total_results > 0) {
      if (
        response.organic_results.length > 0 &&
        response.organic_results[0].link &&
        !response.search_information.spelling_fix &&
        !response.search_information.spelling_fix_type
      ) {
        return {
          linkedinUrl: response.organic_results[0].link,
        }
      }
    }

    return null
  }

  private async queryWithGithubIdentity(
    displayName: string,
    location: string,
    githubIdentity: string,
  ): Promise<IMemberEnrichmentDataSerp> {
    const url = `https://serpapi.com/search.json`

    const config = {
      method: 'get',
      url,
      params: {
        api_key: process.env['CROWD_SERP_API_KEY'],
        q: `"${displayName}" ${location} "${githubIdentity}" site:linkedin.com/in`,
        num: 3,
        engine: 'google',
      },
    }

    const response: IMemberEnrichmentSerpApiResponse = (await axios(config)).data

    if (response.search_information.total_results > 0) {
      if (
        response.organic_results.length > 0 &&
        response.organic_results[0].link &&
        !response.search_information.spelling_fix &&
        !response.search_information.spelling_fix_type
      ) {
        return {
          linkedinUrl: response.organic_results[0].link,
        }
      }
    }

    return null
  }

  private async queryWithEmail(
    displayName: string,
    location: string,
    email: string,
  ): Promise<IMemberEnrichmentDataSerp> {
    const url = `https://serpapi.com/search.json`

    const config = {
      method: 'get',
      url,
      params: {
        api_key: process.env['CROWD_SERP_API_KEY'],
        q: `"${displayName}" ${location} "${email}" site:linkedin.com/in`,
        num: 3,
        engine: 'google',
      },
    }

    const response: IMemberEnrichmentSerpApiResponse = (await axios(config)).data

    if (response.search_information.total_results > 0) {
      if (
        response.organic_results.length > 0 &&
        response.organic_results[0].link &&
        !response.search_information.spelling_fix &&
        !response.search_information.spelling_fix_type
      ) {
        return {
          linkedinUrl: response.organic_results[0].link,
        }
      }
    }

    return null
  }

  normalize(data: IMemberEnrichmentDataSerp): IMemberEnrichmentDataNormalized {
    const normalized: IMemberEnrichmentDataNormalized = {
      identities: [
        {
          platform: PlatformType.LINKEDIN,
          type: MemberIdentityType.USERNAME,
          verified: false,
          value: this.normalizeLinkedUrl(data.linkedinUrl),
        },
      ],
    }
    return normalized
  }

  private normalizeLinkedUrl(url: string): string {
    try {
      const parsedUrl = new URL(url)

      if (parsedUrl.hostname.endsWith('linkedin.com')) {
        parsedUrl.hostname = 'linkedin.com'
        parsedUrl.search = ''

        let path = parsedUrl.pathname
        if (path.endsWith('/')) {
          path = path.slice(0, -1)
        }

        return parsedUrl.origin + path
      }

      return url
    } catch (error) {
      this.log.error(`Error while normalizing linkedin url: ${url}`, error)
      throw error
    }
  }
}
