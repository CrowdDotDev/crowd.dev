import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/organization.repo'
import { getServiceLogger } from '@crowd/logging'
import { OpenSearchService, OrganizationSyncService, getOpensearchClient } from '@crowd/opensearch'

import { DB_CONFIG, OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: organizationId')
  process.exit(1)
}

const organizationId = processArguments[0]

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new OrganizationRepository(store, log)

  const service = new OrganizationSyncService(store, openSearchService, log)

  const results = await repo.checkOrganizationsExists([organizationId])

  if (results.length === 0) {
    log.error(`Organization ${organizationId} not found!`)
    process.exit(1)
  } else {
    log.info(`Organization ${organizationId} found! Triggering sync!`)
    const { documentsIndexed } = await service.syncOrganizations([organizationId])

    log.info(`Synced organizations with ${documentsIndexed} documents!`)
    process.exit(0)
  }
})
