import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'
import { Edition } from '@crowd/types'

import { scheduleMembersEnrichment, scheduleMembersLFIDEnrichment } from './schedules'

const config: Config = {
  envvars: [
    'CROWD_ENRICHMENT_PROGAI_URL',
    'CROWD_ENRICHMENT_PROGAI_API_KEY',
    'CROWD_ENRICHMENT_CLEARBIT_URL',
    'CROWD_ENRICHMENT_CLEARBIT_API_KEY',
    'CROWD_ENRICHMENT_SERP_API_URL',
    'CROWD_ENRICHMENT_SERP_API_KEY',
    'CROWD_ENRICHMENT_CRUSTDATA_URL',
    'CROWD_ENRICHMENT_CRUSTDATA_API_KEY',
  ],
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
