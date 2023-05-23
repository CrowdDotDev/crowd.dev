import { MeiliSearch } from 'meilisearch'
import { SEARCH_ENGINE_CONFIG } from '../conf'

/**
 * Initializes the connection to the Meilisearch search engine
 */
export async function searchEngineInit(): Promise<MeiliSearch> {
  if (SEARCH_ENGINE_CONFIG.host && SEARCH_ENGINE_CONFIG.apiKey) {
    return new MeiliSearch({
      host: SEARCH_ENGINE_CONFIG.host,
      apiKey: SEARCH_ENGINE_CONFIG.apiKey,
    })
  }

  return null
}
