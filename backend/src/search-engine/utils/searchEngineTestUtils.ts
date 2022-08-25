import { IServiceOptions } from '../../services/IServiceOptions'
import { searchEngineInit } from '../searchEngineConnection'

export default class SearchEngineTestUtils {
  static async getSearchEngine(searchEngine?) {
    if (!searchEngine) {
      searchEngine = await searchEngineInit()
    }
    return searchEngine
  }

  static async injectSearchEngine(searchEngine, options) {
    options.searchEngine = await this.getSearchEngine(searchEngine)
    return options as IServiceOptions
  }

  static async deleteIndexes(searchEngine) {
    searchEngine = await this.getSearchEngine(searchEngine)
    const indexes = await searchEngine.getIndexes()
    for (const index of indexes) {
      await index.delete()
    }
  }
}
