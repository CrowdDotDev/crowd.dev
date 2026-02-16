/**
 * Temporal worker setup.
 *
 * Uses the ServiceWorker archetype which handles Temporal connection,
 * workflow bundling, and activity registration automatically.
 */

import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

const config: Config = {
  envvars: [
    'CROWD_SNOWFLAKE_ENABLED_PLATFORMS',
    'CROWD_SNOWFLAKE_S3_REGION',
    'CROWD_SNOWFLAKE_S3_ACCESS_KEY_ID',
    'CROWD_SNOWFLAKE_S3_SECRET_ACCESS_KEY',
  ],
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: false,
  },
  redis: {
    enabled: false,
  },
}

const options: Options = {
  postgres: {
    enabled: false,
  },
  opensearch: {
    enabled: false,
  },
}

export const svc = new ServiceWorker(config, options)
