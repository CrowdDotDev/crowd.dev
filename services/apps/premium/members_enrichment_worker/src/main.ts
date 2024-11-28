import { Edition } from '@crowd/types'

import {
  scheduleMembersEnrichment,
  scheduleMembersLFIDEnrichment,
  scheduleRefreshMembersEnrichmentMaterializedViews,
} from './schedules'
import { svc } from './service'

setImmediate(async () => {
  await svc.init()

  await scheduleRefreshMembersEnrichmentMaterializedViews()
  await scheduleMembersEnrichment()

  if (process.env['CROWD_EDITION'] === Edition.LFX) {
    await scheduleMembersLFIDEnrichment()
  }

  await svc.start()
})
