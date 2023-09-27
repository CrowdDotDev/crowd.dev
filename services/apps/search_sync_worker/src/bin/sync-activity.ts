import { APP_IOC_MODULE } from '@/ioc'
import { APP_IOC } from '@/ioc_constants'
import { ActivityRepository } from '@/repo/activity.repo'
import { ActivitySyncService } from '@/service/activity.sync.service'
import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'

setImmediate(async () => {
  await APP_IOC_MODULE(2)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: activityId')
    process.exit(1)
  }

  const activityId = processArguments[0]

  const service = ioc.get<ActivitySyncService>(APP_IOC.activitySyncService)

  const store = ioc.get<DbStore>(DATABASE_IOC.store)
  const repo = new ActivityRepository(store, log)

  const results = await repo.getActivityData([activityId])

  if (results.length === 0) {
    log.error(`Activity ${activityId} not found!`)
    process.exit(1)
  } else {
    log.info(`Activity ${activityId} found! Triggering sync!`)
    await service.syncActivities([activityId])
    process.exit(0)
  }
})
