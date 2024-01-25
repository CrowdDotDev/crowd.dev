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

const options: Options = {
  maxTaskQueueActivitiesPerSecond: process.env['CROWD_TEMPORAL_TASKQUEUE_CACHE_MAX_ACTIVITIES']
    ? Number(process.env['CROWD_TEMPORAL_TASKQUEUE_CACHE_MAX_ACTIVITIES'])
    : undefined,
  maxConcurrentActivityTaskExecutions: process.env[
    'CROWD_TEMPORAL_TASKQUEUE_CACHE_CONCURRENT_ACTIVITIES'
  ]
    ? Number(process.env['CROWD_TEMPORAL_TASKQUEUE_CACHE_CONCURRENT_ACTIVITIES'])
    : undefined,
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
  await svc.start()
})
