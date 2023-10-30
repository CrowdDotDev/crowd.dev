import { Config } from '@crowd/archetype-standard'
import { ServiceWorker, Options } from '@crowd/archetype-worker'

const config: Config = {
  envvars: [],
  producer: {
    enabled: false,
  },
  temporal: {
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
}

export const svc = new ServiceWorker(config, options)

export const FRONTEND_URL = process.env.CROWD_API_FRONTEND_URL

if (!FRONTEND_URL) {
  throw new Error('CROWD_API_FRONTEND_URL is not set')
}

setImmediate(async () => {
  await svc.init()
  await svc.start()
})
