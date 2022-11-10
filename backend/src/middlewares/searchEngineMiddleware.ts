import { searchEngineInit } from '../search-engine/searchEngineConnection'
import { getServiceLogger } from '../utils/logging'

const log = getServiceLogger()

export async function searchEngineMiddleware(req, res, next) {
  try {
    const searchEngine = await searchEngineInit()
    req.searchEngine = searchEngine
  } catch (error) {
    log.error(error, 'Error connecting to search engine!')
  } finally {
    next()
  }
}
