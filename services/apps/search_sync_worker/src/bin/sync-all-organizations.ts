import { DB_CONFIG } from '@/conf'
import { OpenSearchService } from '@/service/opensearch.service'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { OrganizationRepository } from '@/repo/organization.repo'
import { OrganizationSyncService } from '@/service/organization.sync.service'

const log = getServiceLogger()

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)
  await openSearchService.initialize()

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new OrganizationRepository(store, log)

  const tenantIds = await repo.getTenantIds()

  const service = new OrganizationSyncService(store, openSearchService, log)

  for (const tenantId of tenantIds) {
    await service.syncTenantOrganizations(tenantId, 500)
  }
  process.exit(0)
})
