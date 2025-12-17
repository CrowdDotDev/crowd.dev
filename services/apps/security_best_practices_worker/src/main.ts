import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleTriggerSecurityInsightsCheckForRepos } from './schedules/scheduleCheckReposWithObsoleteSecurityInsights'

const config: Config = {
  envvars: ['CROWD_GITHUB_PERSONAL_ACCESS_TOKENS'],
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
