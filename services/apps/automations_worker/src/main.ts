import { Config } from '@crowd/standard'
import { ServiceWorker, Options } from '@crowd/worker'

const config: Config = {
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: false,
  },
  redis: {
    enabled: false,
  },
}

const options: Options = {
  postgres: {
    enabled: false,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()
  await svc.start()
})
