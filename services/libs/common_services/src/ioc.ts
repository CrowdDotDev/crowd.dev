import { Container } from '@crowd/ioc'
import { LOGGING_IOC_MODULE } from '@crowd/logging'
import { REDIS_IOC_MODULE } from '@crowd/redis'

export const COMMON_SERVICE_IOC = async (
  container: Container,
  config: {
    redisClient?: boolean
    redisPubSub?: boolean
  },
): Promise<void> => {
  const loggingModule = LOGGING_IOC_MODULE()
  container.load(loggingModule)

  if (config.redisClient || config.redisPubSub) {
    const redisModule = await REDIS_IOC_MODULE({
      client: config.redisClient,
      pubsub: config.redisPubSub,
    })

    container.load(redisModule)
  }
}
