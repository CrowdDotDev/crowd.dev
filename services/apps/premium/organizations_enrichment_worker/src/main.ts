import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'
import { scheduleOrganizationCachesEnrichment, scheduleOrganizationUpdate } from './schedules'

const config: Config = {
  envvars: ['CROWD_ORGANIZATION_ENRICHMENT_API_KEY'],
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
    enabled: true,
  },
}

const options: Options = {
  postgres: {
    enabled: true,
  },
  sqs: {
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleOrganizationCachesEnrichment()
  await scheduleOrganizationUpdate()

  await svc.start()
})
