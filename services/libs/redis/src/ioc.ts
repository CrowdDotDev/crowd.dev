import { ContainerModule, IOC_TYPES, containerModule } from '@crowd/ioc'

import { getRedisClient, getRedisPubSubPair } from './client'
import { IRedisConfiguration, IRedisPubSubPair, RedisClient } from './types'

export const REDIS_IOC_MODULE = async (options: {
  client?: boolean
  pubsub?: boolean
}): Promise<ContainerModule> => {
  const config: IRedisConfiguration = {
    username: process.env.CROWD_REDIS_USERNAME,
    password: process.env.CROWD_REDIS_PASSWORD,
    host: process.env.CROWD_REDIS_HOST,
    port: process.env.CROWD_REDIS_PORT,
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
