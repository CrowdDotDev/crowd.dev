import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

const config: Config = {
  envvars: [],
  producer: {
    enabled: true,
  },
  temporal: {
    enabled: true,
  },
  questdb: {
    enabled: false,
  },
  redis: {
    enabled: true,
  },
}

const options: Options = {
  postgres: {
    enabled: true,
  },
  opensearch: {
    enabled: false,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await svc.start()
})
