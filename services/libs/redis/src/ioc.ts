import { getEnvVar } from '@crowd/common'
import { AsyncContainerModule, IOC_TYPES, asyncContainerModule } from '@crowd/ioc'

import { getRedisClient, getRedisPubSubPair } from './client'
import { IRedisConfiguration } from './types'

export const REDIS_IOC_MODULE = (options: {
  client?: boolean
  pubsub?: boolean
}): AsyncContainerModule => {
  let config: IRedisConfiguration
  const loadConfig = (): IRedisConfiguration => {
    if (!config) {
      config = {
        username: getEnvVar('CROWD_REDIS_USERNAME', true),
        password: getEnvVar('CROWD_REDIS_PASSWORD', true),
        host: getEnvVar('CROWD_REDIS_HOST', true),
        port: getEnvVar('CROWD_REDIS_PORT', true),
      }
    }

    return config
  }
  return asyncContainerModule(async (bind) => {
    if (options.client) {
      const client = await getRedisClient(loadConfig(), true)
      bind(IOC_TYPES.REDIS_CLIENT).toConstantValue(client)
    }

    if (options.pubsub) {
      const pubSub = await getRedisPubSubPair(loadConfig())
      bind(IOC_TYPES.REDIS_PUBSUB).toConstantValue(pubSub)
    }
  })
}
