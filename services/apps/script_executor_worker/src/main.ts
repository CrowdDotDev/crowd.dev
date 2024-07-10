import { Config } from '@crowd/archetype-standard'
import { ServiceWorker, Options } from '@crowd/archetype-worker'

const config: Config = {
  envvars: ['CROWD_API_SERVICE_URL', 'CROWD_API_SERVICE_USER_TOKEN'],
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
