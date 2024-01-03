import { Config } from '@crowd/archetype-standard'
import { ServiceWorker, Options } from '@crowd/archetype-worker'
import { scheduleOrganizationsEnrichment } from './schedules'

const config: Config = {
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

  await scheduleOrganizationsEnrichment()

  await svc.start()
})
