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

setImmediate(async () => {
  await svc.init()
  await svc.start()
})
