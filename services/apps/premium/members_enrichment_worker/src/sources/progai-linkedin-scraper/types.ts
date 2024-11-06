import { IMemberEnrichmentLinkedinScraperMetadata } from '../../types'
import { IMemberEnrichmentDataProgAI } from '../progai/types'

export interface IMemberEnrichmentDataProgAILinkedinScraper extends IMemberEnrichmentDataProgAI {
  metadata: IMemberEnrichmentLinkedinScraperMetadata
}
