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
  public enrichMembersWithActivityMoreThan = 10

  public enrichableBySql = `
  ("activitySummary".total_count > ${this.enrichMembersWithActivityMoreThan}) AND
  (members."displayName" like '% %') AND 
  (members.attributes->'location'->>'default' is not null and members.attributes->'location'->>'default' <> '') AND
  ((members.attributes->'websiteUrl'->>'default' is not null and members.attributes->'websiteUrl'->>'default' <> '') OR 
   (mi.verified AND mi.type = 'username' and mi.platform = 'github') OR 
   (mi.verified AND mi.type = 'email')
  )`

  // bust cache after 120 days
  public cacheObsoleteAfterSeconds = 60 * 60 * 24 * 120

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
      enriched = await this.querySerpApi(input.displayName, input.location, input.website)
    }

    if (!enriched && input.displayName && input.location && input.github && input.github.value) {
      enriched = await this.querySerpApi(input.displayName, input.location, input.github.value)
    }

    if (!enriched && input.displayName && input.location && input.email && input.email.value) {
      enriched = await this.querySerpApi(input.displayName, input.location, input.email.value)
    }
    return enriched
  }

  private async querySerpApi(
    displayName: string,
    location: string,
    identifier: string,
  ): Promise<IMemberEnrichmentDataSerp> {
    const config = {
      method: 'get',
      url: process.env['CROWD_ENRICHMENT_SERP_API_URL'],
      params: {
        api_key: process.env['CROWD_ENRICHMENT_SERP_API_KEY'],
        q: `"${displayName}" ${location} "${identifier}" site:linkedin.com/in`,
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
