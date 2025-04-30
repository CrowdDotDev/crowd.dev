import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleTriggerSecurityInsightsCheckForRepos } from './schedules/scheduleCheck'

const config: Config = {
  envvars: ['CROWD_SECURITY_INSIGHTS_GITHUB_TOKEN'],
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
  queue: {
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleTriggerSecurityInsightsCheckForRepos()
  await svc.start()
})
