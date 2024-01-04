import { DB_CONFIG, OPENSEARCH_CONFIG, SERVICE_CONFIG } from '../conf'
import { OpenSearchService, OrganizationSyncService } from '@crowd/opensearch'
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
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new OrganizationSyncService(store, openSearchService, log, SERVICE_CONFIG())

  await service.removeOrganization(organizationId)

  process.exit(0)
})
