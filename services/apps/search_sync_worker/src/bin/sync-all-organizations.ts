import { APP_IOC_MODULE } from '../ioc'
import { APP_IOC } from '../ioc_constants'
import { OrganizationRepository } from '../repo/organization.repo'
import { OrganizationSyncService } from '../service/organization.sync.service'
import { timeout } from '@crowd/common'
import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'

const MAX_CONCURRENT = 3

setImmediate(async () => {
  await APP_IOC_MODULE(MAX_CONCURRENT)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const repo = new OrganizationRepository(store, log)

  const tenantIds = await repo.getTenantIds()

  const service = ioc.get<OrganizationSyncService>(APP_IOC.organizationSyncService)

  let current = 0
  for (let i = 0; i < tenantIds.length; i++) {
    const tenantId = tenantIds[i]

    while (current == MAX_CONCURRENT) {
      await timeout(1000)
    }

    log.info(`Processing tenant ${i + 1}/${tenantIds.length}`)
    current += 1
    service
      .syncTenantOrganizations(tenantId, 500)
      .then(() => {
        current--
        log.info(`Processed tenant ${i + 1}/${tenantIds.length}`)
      })
      .catch((err) => {
        current--
        log.error(
          err,
          { tenantId },
          `Error syncing organizations for tenant ${i + 1}/${tenantIds.length}!`,
        )
      })
  }

  while (current > 0) {
    await timeout(1000)
  }

  process.exit(0)
})
