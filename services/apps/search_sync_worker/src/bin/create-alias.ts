import { getServiceLogger } from '@crowd/logging'
import { OpenSearchService, getOpensearchClient } from '@crowd/opensearch'

import { OPENSEARCH_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 2) {
  log.error('Expected 2 arguments: index and alias')
  process.exit(1)
}

const index = processArguments[0]
const alias = processArguments[1]

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  await openSearchService.createAlias(index, alias)
  process.exit(0)
})
