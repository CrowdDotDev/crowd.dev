import { OrganizationSyncService, OpenSearchService } from '@crowd/opensearch'
import { OPENSEARCH_CONFIG, SERVICE_CONFIG } from '../conf'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/organization.repo'
import { timeout } from '@crowd/common'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const MAX_CONCURRENT = 3

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

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

  if (processArguments.includes('--clean')) {
    const indexingRepo = new IndexingRepository(writeStore, log)
    await indexingRepo.deleteIndexedEntities(IndexedEntityType.ORGANIZATION)
  }

  const readStore = new DbStore(log, readHost)
  const repo = new OrganizationRepository(readStore, log)

  const tenantIds = await repo.getTenantIds()

  const service = new OrganizationSyncService(
    writeStore,
    openSearchService,
    log,
    SERVICE_CONFIG(),
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
