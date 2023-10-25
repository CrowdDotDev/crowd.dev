import { SearchSyncApiClient } from './searchSyncApiClient'

let searchSyncApiClient: SearchSyncApiClient
export const getSearchSyncApiClient = async (): Promise<SearchSyncApiClient> => {
  if (!searchSyncApiClient) {
    searchSyncApiClient = new SearchSyncApiClient()
  }

  return searchSyncApiClient
}
