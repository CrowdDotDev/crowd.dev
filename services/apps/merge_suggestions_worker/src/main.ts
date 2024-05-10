import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleGenerateMemberMergeSuggestions } from './schedules/memberMergeSuggestions'
import { scheduleGenerateOrganizationMergeSuggestions } from './schedules/organizationMergeSuggestions'

const config: Config = {
  envvars: [],
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: true,
  },
  questdb: {
    enabled: false,
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
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleGenerateMemberMergeSuggestions()
  await scheduleGenerateOrganizationMergeSuggestions()

  await svc.start()
})
