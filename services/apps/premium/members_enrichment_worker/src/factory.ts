/* eslint-disable no-case-declarations */

import { Logger } from '@crowd/logging'
import { IEnrichmentService } from './types'
import { MemberEnrichmentSource } from '@crowd/types'
import EnrichmentServiceProgAI from './sources/progai/service'
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
      default:
        throw new Error(`Enrichment source ${source} is not supported`)
    }
  }
}
