import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleOrganizationsEnrichment } from './schedules'

const config: Config = {
  envvars: [
    'CROWD_ORGANIZATION_ENRICHMENT_INTERNAL_API_URL',
    'CROWD_ORGANIZATION_ENRICHMENT_INTERNAL_API_KEY',
  ],
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
  queue: {
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleOrganizationsEnrichment()

  await svc.start()
})
