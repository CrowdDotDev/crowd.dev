import { IOC } from '@crowd/ioc'
import { APP_IOC_MODULE } from '../ioc'
import { APP_IOC } from '../ioc_constants'
import { InitService } from '../service/init.service'
import { MemberSyncService } from '../service/member.sync.service'

setImmediate(async () => {
  await APP_IOC_MODULE(5)
  const ioc = IOC()

  const service = ioc.get<MemberSyncService>(APP_IOC.memberSyncService)

  const pageSize = 100
  let results = await service.getAllIndexedTenantIds(pageSize)

  while (results.data.length > 0) {
    for (const id of results.data) {
      if (id !== InitService.FAKE_TENANT_ID) {
        await service.cleanupMemberIndex(id)
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
