import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleMembersCleanup, scheduleOrganizationsCleanup } from './schedules/scheduleCleanup'
import { scheduleCopyActivitiesFromQuestdbToTinybird } from './schedules/scheduleCopyActivitiesFromQuestdbToTinybird'
import { schedulePopulateActivityRelations } from './schedules/schedulePopulateActivityRelations'

const config: Config = {
  envvars: ['CROWD_TINYBIRD_ACCESS_TOKEN'],
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

  await schedulePopulateActivityRelations()
  await scheduleCopyActivitiesFromQuestdbToTinybird()

  await scheduleMembersCleanup()
  await scheduleOrganizationsCleanup()

  await svc.start()
})
