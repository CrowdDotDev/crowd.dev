import { Config } from '@crowd/standard'
import { ServiceWorker, Options } from '@crowd/worker'

const config: Config = {
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: true,
  },
  redis: {
    enabled: false,
  },
}

const options: Options = {
  postgres: {
    enabled: true,
  },
}

const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.start()
})
