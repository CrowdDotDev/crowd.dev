import { Config } from '@crowd/archetype-standard'
import { ServiceWorker, Options } from '@crowd/archetype-worker'
import { scheduleRecalculateAffiliationsOfNewRolesForEachTenant } from './schedules/triggerRecalculateAffiliationsOfNewRolesForEachTenant'

const config: Config = {
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

setImmediate(async () => {
  await svc.init()

  await scheduleRecalculateAffiliationsOfNewRolesForEachTenant()

  await svc.start()
})
