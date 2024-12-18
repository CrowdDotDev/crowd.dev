import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { OpenSearchService, OrganizationSyncService, getOpensearchClient } from '@crowd/opensearch'
import { getClientSQL } from '@crowd/questdb'

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
  const qdbConn = await getClientSQL()
  const qdbStore = new DbStore(log, qdbConn)

  const service = new OrganizationSyncService(qdbStore, store, openSearchService, log)

  await service.removeOrganization(organizationId)

  process.exit(0)
})
