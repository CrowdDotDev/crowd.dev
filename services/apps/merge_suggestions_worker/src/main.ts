import { Config } from '@crowd/archetype-standard'
import { ServiceWorker, Options } from '@crowd/archetype-worker'

import { scheduleGenerateMemberMergeSuggestions } from 'schedules/memberMergeSuggestions'

const config: Config = {
  envvars: [],
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
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleGenerateMemberMergeSuggestions()

  await svc.start()
})
