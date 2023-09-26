import { Container, ContainerModule } from 'inversify'
import { getRedisClient } from './client'
import { IRedisConfiguration } from './types'
import { ApiPubSubEmitter } from './instances'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { isFlagSet } from '@crowd/common'

export const REDIS_IOC = {
  config: Symbol('redisConfig'),
  client: Symbol('redisClient'),

  pubsub: {
    apiEmitter: Symbol('apiPubSubEmitter'),
  },
}

export enum PubSubEmitter {
  API = 1 << 0,
}

export const REDIS_IOC_MODULE = async (
  ioc: Container,
  config: IRedisConfiguration,
  loadEmittersFlag?: number,
): Promise<ContainerModule> => {
  const client = await getRedisClient(config, true)

  let apiEmitter: ApiPubSubEmitter | undefined
  if (loadEmittersFlag) {
    const log = ioc.get<Logger>(LOGGING_IOC.logger)
    if (isFlagSet(loadEmittersFlag, PubSubEmitter.API)) {
      apiEmitter = new ApiPubSubEmitter(client, log)
    }
  }

  return new ContainerModule((bind) => {
    bind(REDIS_IOC.config).toConstantValue(config)
    bind(REDIS_IOC.client).toConstantValue(client)

    if (apiEmitter) {
      bind(REDIS_IOC.pubsub.apiEmitter).toConstantValue(apiEmitter)
    }
  })
}
