import { APP_IOC_MODULE } from '@/ioc'
import { APP_IOC } from '@/ioc_constants'
import { OrganizationRepository } from '@/repo/organization.repo'
import { OrganizationSyncService } from '@/service/organization.sync.service'
import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: organizationId')
    process.exit(1)
  }

  const organizationId = processArguments[0]

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const repo = new OrganizationRepository(store, log)

  const service = ioc.get<OrganizationSyncService>(APP_IOC.organizationSyncService)

  const results = await repo.getOrganizationData([organizationId])

  if (results.length === 0) {
    log.error(`Organization ${organizationId} not found!`)
    process.exit(1)
  } else {
    log.info(`Organization ${organizationId} found! Triggering sync!`)
    await service.syncOrganizations([organizationId])
    process.exit(0)
  }
})
