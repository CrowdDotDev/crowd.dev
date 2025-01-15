import { timeout } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/organization.repo'
import { getServiceLogger } from '@crowd/logging'
import { OpenSearchService, OrganizationSyncService, getOpensearchClient } from '@crowd/opensearch'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'
import { getClientSQL } from '@crowd/questdb'

import { OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const MAX_CONCURRENT = 3

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
  const repo = new OrganizationRepository(readStore, log)

  const tenantIds = await repo.getTenantIds()

  const service = new OrganizationSyncService(
    qdbStore,
    writeStore,
    openSearchService,
    log,
    readStore,
  )

  let current = 0
  for (let i = 0; i < tenantIds.length; i++) {
    const tenantId = tenantIds[i]

    while (current == MAX_CONCURRENT) {
      await timeout(1000)
    }

    log.info(`Processing tenant ${i + 1}/${tenantIds.length}`)
    current += 1
    service
      .syncTenantOrganizations(tenantId, 500, { withAggs })
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
