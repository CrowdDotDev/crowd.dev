import axios from 'axios'

import { Logger, LoggerBase } from '@crowd/logging'
import { IMemberIdentity, MemberEnrichmentSource, PlatformType } from '@crowd/types'

import { findMemberEnrichmentCacheForAllSources } from '../../activities/enrichment'
import { EnrichmentSourceServiceFactory } from '../../factory'
import {
  IEnrichmentService,
  IEnrichmentSourceInput,
  IMemberEnrichmentDataNormalized,
} from '../../types'
import { IMemberEnrichmentDataProgAI, IMemberEnrichmentDataProgAIResponse } from '../progai/types'

export default class EnrichmentServiceProgAILinkedinScraper
  extends LoggerBase
  implements IEnrichmentService
{
  public source: MemberEnrichmentSource = MemberEnrichmentSource.PROGAI_LINKEDIN_SCRAPER
  public platform = `enrichment-${this.source}`

  public alsoFindInputsInSourceCaches: MemberEnrichmentSource[] = [
    MemberEnrichmentSource.CLEARBIT,
    MemberEnrichmentSource.SERP,
  ]

  public enrichableBySql = `(mi.verified AND mi.type = 'username' and mi.platform = 'linkedin')`

  // bust cache after 120 days
  public cacheObsoleteAfterSeconds = 60 * 60 * 24 * 120

  constructor(public readonly log: Logger) {
    super(log)
  }

  // in addition to members with linkedin identity
  // we'll also use existing cache rows from other sources (serp and clearbit)
  // if there are linkedin urls there as well, we'll enrich using these also
  async isEnrichableBySource(input: IEnrichmentSourceInput): Promise<boolean> {
    const caches = await findMemberEnrichmentCacheForAllSources(input.memberId)

    let hasEnrichableLinkedinInCache = false
    for (const cache of caches) {
      if (this.alsoFindInputsInSourceCaches.includes(cache.source)) {
        const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(
          cache.source,
          this.log,
        )
        const normalized = service.normalize(cache.data) as IMemberEnrichmentDataNormalized
        if (normalized.identities.some((i) => i.platform === PlatformType.LINKEDIN)) {
          hasEnrichableLinkedinInCache = true
          break
        }

        break
      }
    }

    return (
      hasEnrichableLinkedinInCache ||
      (input.linkedin && input.linkedin.value && input.linkedin.verified)
    )
  }

  async hasRemainingCredits(): Promise<boolean> {
    return true
  }

  private async findConsumableLinkedinIdentities(
    input: IEnrichmentSourceInput,
  ): Promise<IMemberIdentity[]> {
    const consumableIdentities: IMemberIdentity[] = []
    const caches = await findMemberEnrichmentCacheForAllSources(input.memberId)
    const linkedinUrlHashmap = new Map<string, boolean>()

    for (const cache of caches) {
      if (this.alsoFindInputsInSourceCaches.includes(cache.source)) {
        const service = EnrichmentSourceServiceFactory.getEnrichmentSourceService(
          cache.source,
          this.log,
        )
        const normalized = service.normalize(cache.data) as IMemberEnrichmentDataNormalized
        if (normalized.identities.some((i) => i.platform === PlatformType.LINKEDIN)) {
          const identity = normalized.identities.find((i) => i.platform === PlatformType.LINKEDIN)
          if (!linkedinUrlHashmap.get(identity.value)) {
            consumableIdentities.push(identity)
            linkedinUrlHashmap.set(identity.value, true)
          }
        }
      }
    }

    // also add the linkedin identity from the input
    if (
      input.linkedin &&
      input.linkedin.value &&
      input.linkedin.verified &&
      !linkedinUrlHashmap.get(input.linkedin.value)
    ) {
      consumableIdentities.push(input.linkedin)
    }

    return consumableIdentities
  }

  async getData(input: IEnrichmentSourceInput): Promise<IMemberEnrichmentDataProgAI[] | null> {
    const profiles: IMemberEnrichmentDataProgAI[] = []
    const consumableIdentities = await this.findConsumableLinkedinIdentities(input)

    for (const identity of consumableIdentities) {
      const data = await this.getDataUsingLinkedinHandle(identity.value)
      if (data) {
        profiles.push(data)
      }
    }

    return profiles.length > 0 ? profiles : null
  }

  private async getDataUsingLinkedinHandle(handle: string): Promise<IMemberEnrichmentDataProgAI> {
    let response: IMemberEnrichmentDataProgAIResponse

    try {
      const url = `${process.env['CROWD_ENRICHMENT_PROGAI_URL']}/get_profile`
      const config = {
        method: 'get',
        url,
        params: {
          linkedin_url: `https://linkedin.com/in/${handle}`,
          with_emails: true,
          api_key: process.env['CROWD_ENRICHMENT_PROGAI_API_KEY'],
        },
        headers: {},
      }

      response = (await axios(config)).data
    } catch (err) {
      throw new Error(err)
    }

    return response.profile
  }

  normalize(profiles: IMemberEnrichmentDataProgAI[]): IMemberEnrichmentDataNormalized[] {
    const normalizedProfiles: IMemberEnrichmentDataNormalized[] = []
    const progaiService = EnrichmentSourceServiceFactory.getEnrichmentSourceService(
      MemberEnrichmentSource.PROGAI,
      this.log,
    )

    for (const profile of profiles) {
      const normalized = progaiService.normalize(profile) as IMemberEnrichmentDataNormalized
      normalizedProfiles.push(normalized)
    }

    return normalizedProfiles.length > 0 ? normalizedProfiles : null
  }
}
