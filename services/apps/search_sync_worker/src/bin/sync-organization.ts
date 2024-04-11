import { OrganizationSyncService, OpenSearchService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG, SERVICE_CONFIG } from '../conf'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/organization.repo'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: organizationId')
  process.exit(1)
}

const organizationId = processArguments[0]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const qdbConn = await getClientSQL()
  const qdbStore = new DbStore(log, qdbConn)

  const repo = new OrganizationRepository(store, log)

  const service = new OrganizationSyncService(
    store,
    qdbStore,
    openSearchService,
    log,
    SERVICE_CONFIG(),
  )

  const results = await repo.checkOrganizationsExists([organizationId])

  if (results.length === 0) {
    log.error(`Organization ${organizationId} not found!`)
    process.exit(1)
  } else {
    log.info(`Organization ${organizationId} found! Triggering sync!`)
    const { organizationsSynced, documentsIndexed } = await service.syncOrganizations([
      organizationId,
    ])

    log.info(
      `Synced total of ${organizationsSynced} organizations with ${documentsIndexed} documents!`,
    )
    process.exit(0)
  }
})
