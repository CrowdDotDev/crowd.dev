import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import {
  scheduleRefreshMemberDisplayAggregates,
  scheduleRefreshOrganizationDisplayAggregates,
} from './schedules/refreshDisplayAggregates'
import { scheduleRecalculateAffiliationsOfNewRoles } from './schedules/triggerRecalculateAffiliationsOfNewRoles'

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
  queue: {
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  await scheduleRecalculateAffiliationsOfNewRoles()

  await scheduleRefreshMemberDisplayAggregates()
  await scheduleRefreshOrganizationDisplayAggregates()

  await svc.start()
})
