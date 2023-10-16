import { Config } from '@crowd/standard'
import { ServiceConsumer, Options } from '@crowd/consumer'

const config: Config = {
  producer: {
    enabled: false,
    idempotent: true,
  },
  temporal: {
    enabled: true,
  },
  redis: {
    enabled: false,
  },
}

const options: Options = {
  maxWaitTimeInMs: 1000,
  retryPolicy: {
    initialRetryTime: 1000,
    maxRetryTime: 1000,
    retries: 1000,
  },
}

const svc = new ServiceConsumer(config, options)

setImmediate(async () => {
  await svc.start()

  // await svc.consumer.run({
  //   eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {},
  // })
})
