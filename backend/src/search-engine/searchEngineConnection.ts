import { MeiliSearch } from 'meilisearch'
import { getConfig } from '../config'

/**
 * Initializes the connection to the Meilisearch search engine
 */
export async function searchEngineInit(): Promise<MeiliSearch> {
  const client = new MeiliSearch({
    host: getConfig().SEARCH_ENGINE_HOST,
    apiKey: getConfig().SEARCH_ENGINE_API_KEY,
  })

  return client
}
