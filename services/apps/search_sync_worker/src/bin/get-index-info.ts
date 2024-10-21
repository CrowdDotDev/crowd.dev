import { getServiceLogger } from '@crowd/logging'
import { OpenSearchService, getOpensearchClient } from '@crowd/opensearch'

import { OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 arguments: IndexName')
  process.exit(1)
}

const index = processArguments[0]

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  const result = await openSearchService.getIndexInfo(index)
  console.log(result)
  process.exit(0)
})
