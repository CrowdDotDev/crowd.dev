import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { OrganizationSyncService, OpenSearchService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG, SERVICE_CONFIG } from '../conf'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/organization.repo'
import { timeout } from '@crowd/common'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'

const log = getServiceLogger()

const MAX_CONCURRENT = 3

const options = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'clean',
    alias: 'c',
    type: Boolean,
    description: 'Clean indexed_entities table for a full sync',
  },
  {
    name: 'segmentIds',
    alias: 's',
    type: String,
    description: 'Syncing to only specific segmentIds',
  },
]
const sections = [
  {
    header: `Sync all organizations to OpenSearch`,
    content: 'Sync all organizations to OpenSearch',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

    const dbConnection = await getDbConnection(DB_CONFIG())
    const store = new DbStore(log, dbConnection)

    if (parameters.clean) {
      const indexingRepo = new IndexingRepository(store, log)
      await indexingRepo.deleteIndexedEntities(IndexedEntityType.ORGANIZATION)
    }

    const repo = new OrganizationRepository(store, log)

    const tenantIds = await repo.getTenantIds()

    const segmentIds = parameters.segmentIds ? parameters.segmentIds.split(',') : undefined

    const service = new OrganizationSyncService(store, openSearchService, log, SERVICE_CONFIG())

    let current = 0
    for (let i = 0; i < tenantIds.length; i++) {
      const tenantId = tenantIds[i]

      while (current == MAX_CONCURRENT) {
        await timeout(1000)
      }

      log.info(`Processing tenant ${i + 1}/${tenantIds.length}`)
      current += 1
      service
        .syncTenantOrganizations(tenantId, 500, segmentIds)
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
}
