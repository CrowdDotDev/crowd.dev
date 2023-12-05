import { OpenSearchService, OpenSearchIndex } from '@crowd/opensearch'
import { getServiceLogger } from '@crowd/logging'
import { OPENSEARCH_CONFIG } from 'conf'

const log = getServiceLogger()

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  await openSearchService.initialize()
  await openSearchService.setIndexMappings(OpenSearchIndex.MEMBERS)
  await openSearchService.setIndexMappings(OpenSearchIndex.ACTIVITIES)
  process.exit(0)
})
