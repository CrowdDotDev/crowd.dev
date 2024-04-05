import { Config } from '@crowd/archetype-standard'
import { Options, ServiceConsumer } from '@crowd/archetype-consumer'

const config: Config = {
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: true,
  },
  questdb: {
    enabled: false,
  },
  redis: {
    enabled: false,
  },
}

const options: Options = {
  maxWaitTimeInMs: 1000,
  retryPolicy: {
    initialRetryTime: 500,
    maxRetryTime: 15000,
    retries: 10,
  },
}

export const svc = new ServiceConsumer(config, options)

setImmediate(async () => {
  await svc.init()
  await svc.start()

  // await svc.consumer.run({
  //   eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {},
  // })
})
