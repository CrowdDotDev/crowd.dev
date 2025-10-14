/* eslint-disable no-case-declarations */
import { Logger } from '@crowd/logging'
import { OrganizationEnrichmentSource } from '@crowd/types'

import EnrichmentServiceInternalAPI from './sources/internal-api/service'
import { IOrganizationEnrichmentService } from './types'

export class OrganizationEnrichmentSourceServiceFactory {
  static getEnrichmentSourceService(
    source: OrganizationEnrichmentSource,
    log: Logger,
  ): IOrganizationEnrichmentService {
    switch (source) {
      case OrganizationEnrichmentSource.INTERNAL_API:
        return new EnrichmentServiceInternalAPI(log)
      default:
        throw new Error(`Organization enrichment service for ${source} is not found!`)
    }
  }
}
