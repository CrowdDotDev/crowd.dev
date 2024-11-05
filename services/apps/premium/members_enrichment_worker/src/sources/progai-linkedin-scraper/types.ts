import { IMemberEnrichmentDataProgAI } from '../progai/types'

export interface IMemberEnrichmentDataProgAILinkedinScraper extends IMemberEnrichmentDataProgAI {
  metadata: {
    repeatedTimesInDifferentSources: number
    isFromVerifiedSource: boolean
  }
}
