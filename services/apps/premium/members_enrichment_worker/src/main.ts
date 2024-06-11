import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleMembersEnrichment, scheduleMembersLFIDEnrichment } from './schedules'
import { Edition } from '@crowd/types'

const config: Config = {
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: true,
  },
  questdb: {
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
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleMembersEnrichment()

  if (process.env['CROWD_EDITION'] === Edition.LFX) {
    await scheduleMembersLFIDEnrichment()
  }

  await svc.start()
})
