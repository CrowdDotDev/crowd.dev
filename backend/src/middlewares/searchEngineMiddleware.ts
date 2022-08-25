import { searchEngineInit } from '../search-engine/searchEngineConnection'

export async function searchEngineMiddleware(req, res, next) {
  try {
    const searchEngine = await searchEngineInit()
    req.searchEngine = searchEngine
  } catch (error) {
    console.error(error)
  } finally {
    next()
  }
}
