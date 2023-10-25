import config from 'config'
export interface ISearchSyncApiServiceConfig {
  port: number
}

let searchSyncApiConfig: ISearchSyncApiServiceConfig
export const SEARCH_SYNC_API_CONFIG = (): ISearchSyncApiServiceConfig => {
  if (searchSyncApiConfig) return searchSyncApiConfig

  searchSyncApiConfig = config.get<ISearchSyncApiServiceConfig>('service')
  return searchSyncApiConfig
}
