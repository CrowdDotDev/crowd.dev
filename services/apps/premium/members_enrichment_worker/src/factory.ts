/* eslint-disable no-case-declarations */
import { Logger } from '@crowd/logging'
import { MemberEnrichmentSource } from '@crowd/types'

import EnrichmentServiceClearbit from './sources/clearbit/service'
import EnrichmentServiceCrustdata from './sources/crustdata/service'
import EnrichmentServiceProgAILinkedinScraper from './sources/progai-linkedin-scraper/service'
import EnrichmentServiceProgAI from './sources/progai/service'
import EnrichmentServiceSerpApi from './sources/serp/service'
import { IEnrichmentService } from './types'
import { ALSO_USE_EMAIL_IDENTITIES_FOR_ENRICHMENT, ENRICH_EMAIL_IDENTITIES } from './utils/config'

export class EnrichmentSourceServiceFactory {
  static getEnrichmentSourceService(
    source: MemberEnrichmentSource,
    log: Logger,
  ): IEnrichmentService {
    switch (source) {
      case MemberEnrichmentSource.PROGAI:
        return new EnrichmentServiceProgAI(
          log,
          ALSO_USE_EMAIL_IDENTITIES_FOR_ENRICHMENT,
          ENRICH_EMAIL_IDENTITIES,
        )
      case MemberEnrichmentSource.CLEARBIT:
        return new EnrichmentServiceClearbit(log)
      case MemberEnrichmentSource.SERP:
        return new EnrichmentServiceSerpApi(log)
      case MemberEnrichmentSource.PROGAI_LINKEDIN_SCRAPER:
        return new EnrichmentServiceProgAILinkedinScraper(log)
      case MemberEnrichmentSource.CRUSTDATA:
        return new EnrichmentServiceCrustdata(log)
      default:
        throw new Error(`Enrichment service for ${source} is not found!`)
    }
  }
}
