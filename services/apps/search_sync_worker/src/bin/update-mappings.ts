import { getServiceLogger } from '@crowd/logging'
import { OpenSearchIndex, OpenSearchService, getOpensearchClient } from '@crowd/opensearch'

import { OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  await openSearchService.initialize()
  await openSearchService.setIndexMappings(OpenSearchIndex.MEMBERS)
  await openSearchService.setIndexMappings(OpenSearchIndex.ORGANIZATIONS)
  process.exit(0)
})
