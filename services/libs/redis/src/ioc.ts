import { getEnvVar } from '@crowd/common'
import { ContainerModule, IOC_TYPES, containerModule } from '@crowd/ioc'

import { getRedisClient, getRedisPubSubPair } from './client'
import { IRedisConfiguration, IRedisPubSubPair, RedisClient } from './types'

export const REDIS_IOC_MODULE = async (options: {
  client?: boolean
  pubsub?: boolean
}): Promise<ContainerModule> => {
  const config: IRedisConfiguration = {
    username: getEnvVar('CROWD_REDIS_USERNAME', true),
    password: getEnvVar('CROWD_REDIS_PASSWORD', true),
    host: getEnvVar('CROWD_REDIS_HOST', true),
    port: getEnvVar('CROWD_REDIS_PORT', true),
  }

  let client: RedisClient
  let pubSub: IRedisPubSubPair

  if (options.client) {
    client = await getRedisClient(config, true)
  }

  if (options.pubsub) {
    pubSub = await getRedisPubSubPair(config)
  }

  return containerModule((bind) => {
    if (client) {
      bind(IOC_TYPES.REDIS_CLIENT).toConstantValue(client)
    }

    if (pubSub) {
      bind(IOC_TYPES.REDIS_PUBSUB).toConstantValue(pubSub)
    }
  })
}
