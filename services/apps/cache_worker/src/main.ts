import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleComputeOrgAggsDaily } from './schedules'
import { scheduleRefreshDashboardCacheDaily } from './schedules/refreshDashboardCacheDaily'

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
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleComputeOrgAggsDaily()
  await scheduleRefreshDashboardCacheDaily()

  await svc.start()
})
