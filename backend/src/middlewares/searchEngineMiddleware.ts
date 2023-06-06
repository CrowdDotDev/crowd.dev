import { getServiceLogger } from '@crowd/logging'
import { SEARCH_ENGINE_CONFIG } from '../conf/index'
import { searchEngineInit } from '../search-engine/searchEngineConnection'

const log = getServiceLogger()

export async function searchEngineMiddleware(req, res, next) {
  try {
    if (SEARCH_ENGINE_CONFIG.host && SEARCH_ENGINE_CONFIG.apiKey) {
      const searchEngine = await searchEngineInit()
      req.searchEngine = searchEngine
    }
  } catch (error) {
    log.error(error, 'Error connecting to search engine!')
  } finally {
    next()
  }
}
