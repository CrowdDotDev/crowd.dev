import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { OpenSearchService, OrganizationSyncService, getOpensearchClient } from '@crowd/opensearch'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'
import { getClientSQL } from '@crowd/questdb'

import { OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  const writeHost = await getDbConnection({
    host: process.env.CROWD_DB_WRITE_HOST,
    port: parseInt(process.env.CROWD_DB_PORT),
    database: process.env.CROWD_DB_DATABASE,
    user: process.env.CROWD_DB_USERNAME,
    password: process.env.CROWD_DB_PASSWORD,
  })

  const writeStore = new DbStore(log, writeHost)

  const readHost = await getDbConnection({
    host: process.env.CROWD_DB_READ_HOST,
    port: parseInt(process.env.CROWD_DB_PORT),
    database: process.env.CROWD_DB_DATABASE,
    user: process.env.CROWD_DB_USERNAME,
    password: process.env.CROWD_DB_PASSWORD,
  })

  const qdbConn = await getClientSQL()
  const qdbStore = new DbStore(log, qdbConn)

  if (processArguments.includes('--clean')) {
    const indexingRepo = new IndexingRepository(writeStore, log)
    await indexingRepo.deleteIndexedEntities(IndexedEntityType.ORGANIZATION)
  }

  let withAggs = true

  if (processArguments.includes('--no-aggs')) {
    withAggs = false
  }

  const readStore = new DbStore(log, readHost)

  const service = new OrganizationSyncService(
    qdbStore,
    writeStore,
    openSearchService,
    log,
    readStore,
  )

  log.info('Starting sync of all organizations')

  try {
    await service.syncAllOrganizations(500, { withAggs })
    log.info('Successfully synced all organizations')
  } catch (err) {
    log.error(err, 'Error syncing organizations!')
  }

  process.exit(0)
})

