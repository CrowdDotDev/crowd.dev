import { IOpenSearchConfig } from '@crowd/types'
import { ContainerModule } from 'inversify'
import { getOpensearchClient } from './client'

export const OPENSEARCH_IOC = {
  config: Symbol('opensearchConfig'),
  client: Symbol('opensearchClient'),
}

export const OPENSEARCH_IOC_MODULE = (config: IOpenSearchConfig): ContainerModule => {
  return new ContainerModule((bind) => {
    bind(OPENSEARCH_IOC.config).toConstantValue(config)
    bind(OPENSEARCH_IOC.client).toConstantValue(getOpensearchClient(config))
  })
}
