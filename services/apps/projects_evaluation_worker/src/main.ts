import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleProjectsEvaluation } from './schedules/scheduleProjectsEvaluation'

const config: Config = {
  envvars: ['CROWD_API_SERVICE_URL', 'CROWD_PROJECT_EVALUATION_STATIC_API_KEY'],
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: true,
  },
  redis: {
    enabled: false,
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

// TODO(CM-1841): drop once snowflake-sdk stops building a region-less STS client on import
process.env.SNOWFLAKE_DISABLE_PLATFORM_DETECTION ??= 'true'

setImmediate(async () => {
  await svc.init()

  svc.log.info('Projects evaluation worker starting up.')

  await scheduleProjectsEvaluation()

  svc.log.info('Projects evaluation worker running — schedule registered, waiting for Temporal.')

  await svc.start()
})
