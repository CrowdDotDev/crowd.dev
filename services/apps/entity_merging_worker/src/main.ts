import { Config } from '@crowd/archetype-standard'
import { ServiceWorker, Options } from '@crowd/archetype-worker'

const config: Config = {
  envvars: [],
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: true,
  },
  redis: {
    enabled: true,
  },
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const options: Options = {
  postgres: {
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()
  await svc.start()
})
