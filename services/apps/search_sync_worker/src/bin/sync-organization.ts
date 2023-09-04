import { DB_CONFIG } from '@/conf'
import { OrganizationRepository } from '@/repo/organization.repo'
import { OpenSearchService } from '@/service/opensearch.service'
import { OrganizationSyncService } from '@/service/organization.sync.service'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: organizationId')
  process.exit(1)
}

const organizationId = processArguments[0]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new OrganizationRepository(store, log)

  const service = new OrganizationSyncService(store, openSearchService, log)

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
