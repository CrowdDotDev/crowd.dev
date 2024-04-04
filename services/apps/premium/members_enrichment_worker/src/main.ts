import { Config } from '@crowd/archetype-standard'
import { ServiceWorker, Options } from '@crowd/archetype-worker'

import { scheduleMembersEnrichment, scheduleMembersLFIDEnrichment } from './schedules'

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
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleMembersEnrichment()

  if (process.env['CROWD_EDITION'] === 'lfx-ee') {
    await scheduleMembersLFIDEnrichment()
  }

  await svc.start()
})
