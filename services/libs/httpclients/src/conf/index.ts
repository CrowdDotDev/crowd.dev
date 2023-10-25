import config from 'config'

export interface IServiceConfig {
  edition: string
  searchSyncApiUrl: string
}

let serviceConfig: IServiceConfig
export const SERVICE_CONFIG = (): IServiceConfig => {
  if (serviceConfig) return serviceConfig

  serviceConfig = config.get<IServiceConfig>('service')
  return serviceConfig
}
