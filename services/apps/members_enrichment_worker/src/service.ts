import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

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
