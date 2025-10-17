/* eslint-disable no-case-declarations */
import { Logger } from '@crowd/logging'
import { OrganizationEnrichmentSource } from '@crowd/types'

import EnrichmentServiceLFXInternalAPI from './sources/lfx-internal-api/service'
import { IOrganizationEnrichmentService } from './types'

export class OrganizationEnrichmentSourceServiceFactory {
  static getEnrichmentSourceService(
    source: OrganizationEnrichmentSource,
    log: Logger,
  ): IOrganizationEnrichmentService {
    switch (source) {
      case OrganizationEnrichmentSource.LFX_INTERNAL_API:
        return new EnrichmentServiceLFXInternalAPI(log)
      default:
        throw new Error(`Organization enrichment service for ${source} is not found!`)
    }
  }
}
