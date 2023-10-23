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
    enabled: true,
  },
}

const options: Options = {
  postgres: {
    enabled: true,
  },
}

const svc = new ServiceWorker(config, options)
export const dbStore = svc.postgres
export const serviceLog = svc.log
export const redis = svc.redis
export const FRONTEND_URL = process.env.CROWD_API_FRONTEND_URL

if (!FRONTEND_URL) {
  throw new Error('CROWD_API_FRONTEND_URL is not set')
}

setImmediate(async () => {
  await svc.init()
  await svc.start()
})
