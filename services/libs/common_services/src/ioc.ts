import { Container } from '@crowd/ioc'
import { REDIS_IOC_MODULE } from '@crowd/redis'

export const COMMON_SERVICE_IOC = async (
  container: Container,
  config: {
    redisClient?: boolean
    redisPubSub?: boolean
  },
): Promise<void> => {
  if (config.redisClient || config.redisPubSub) {
    const redisModule = REDIS_IOC_MODULE({
      client: config.redisClient,
      pubsub: config.redisPubSub,
    })

    await container.loadAsync(redisModule)
  }
}
