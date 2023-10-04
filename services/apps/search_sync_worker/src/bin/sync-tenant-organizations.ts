import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { APP_IOC_MODULE } from '../ioc'
import { APP_IOC } from '../ioc_constants'
import { OrganizationSyncService } from '../service/organization.sync.service'

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

  const service = ioc.get<OrganizationSyncService>(APP_IOC.organizationSyncService)

  await service.syncTenantOrganizations(tenantId)

  process.exit(0)
})
