import { DB_CONFIG } from '@/conf'
import { OpenSearchService } from '@/service/opensearch.service'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { OrganizationRepository } from '@/repo/organization.repo'
import { OrganizationSyncService } from '@/service/organization.sync.service'
import { timeout } from '@crowd/common'

const log = getServiceLogger()

const MAX_CONCURRENT = 3

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new OrganizationRepository(store, log)

  const tenantIds = await repo.getTenantIds()

  const service = new OrganizationSyncService(store, openSearchService, log)

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
