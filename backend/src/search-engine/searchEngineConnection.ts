import { MeiliSearch } from 'meilisearch'
import { SEARCH_ENGINE_CONFIG } from '../config'

/**
 * Initializes the connection to the Meilisearch search engine
 */
export async function searchEngineInit(): Promise<MeiliSearch> {
  const client = new MeiliSearch({
    host: SEARCH_ENGINE_CONFIG.host,
    apiKey: SEARCH_ENGINE_CONFIG.apiKey,
  })

  return client
}
