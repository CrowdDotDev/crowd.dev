import { OpenSearchService } from '../service/opensearch.service'
import { OpenSearchIndex } from '../types'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  await openSearchService.initialize()
  await openSearchService.setIndexMappings(OpenSearchIndex.MEMBERS)
  await openSearchService.setIndexMappings(OpenSearchIndex.ACTIVITIES)
  process.exit(0)
})
