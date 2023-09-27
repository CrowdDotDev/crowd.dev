import { APP_IOC_MODULE } from '@/ioc'
import { APP_IOC } from '@/ioc_constants'
import { ActivitySyncService } from '@/service/activity.sync.service'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: tenantId')
    process.exit(1)
  }

  const tenantId = processArguments[0]

  const service = ioc.get<ActivitySyncService>(APP_IOC.activitySyncService)

  await service.syncTenantActivities(tenantId)

  process.exit(0)
})
