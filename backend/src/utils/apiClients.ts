import { SearchSyncApiClient } from '@crowd/httpclients'
import { SEARCH_SYNC_API_CONFIG } from '../conf'

const config = SEARCH_SYNC_API_CONFIG

let searchSyncApiClient: SearchSyncApiClient
export const getSearchSyncApiClient = async (): Promise<SearchSyncApiClient> => {
  if (!searchSyncApiClient) {
    searchSyncApiClient = new SearchSyncApiClient(config)
  }

  return searchSyncApiClient
}
