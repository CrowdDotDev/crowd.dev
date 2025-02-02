import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { OpenSearchService, OrganizationSyncService, getOpensearchClient } from '@crowd/opensearch'
import { getClientSQL } from '@crowd/questdb'

import { DB_CONFIG, OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const qdbConn = await getClientSQL()
  const qdbStore = new DbStore(log, qdbConn)

  const service = new OrganizationSyncService(qdbStore, store, openSearchService, log)

  await service.cleanupOrganizationIndex()

  process.exit(0)
})
