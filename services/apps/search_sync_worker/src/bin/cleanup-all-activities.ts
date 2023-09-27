import { APP_IOC_MODULE } from '../ioc'
import { APP_IOC } from '../ioc_constants'
import { ActivitySyncService } from '../service/activity.sync.service'
import { InitService } from '../service/init.service'
import { IOC } from '@crowd/ioc'

setImmediate(async () => {
  await APP_IOC_MODULE(5)
  const ioc = IOC()

  const service = ioc.get<ActivitySyncService>(APP_IOC.activitySyncService)

  const pageSize = 100
  let results = await service.getAllIndexedTenantIds(pageSize)

  while (results.data.length > 0) {
    for (const id of results.data) {
      if (id !== InitService.FAKE_TENANT_ID) {
        await service.cleanupActivityIndex(id)
      }
    }
    if (results.afterKey) {
      results = await service.getAllIndexedTenantIds(pageSize, results.afterKey)
    } else {
      results = { data: [] }
    }
  }

  process.exit(0)
})
