import { OpenSearchService } from '@/service/opensearch.service'
import { getServiceLogger } from '@crowd/logging'
import { OpenSearchIndex } from '@/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 2) {
  log.error('Expected 2 arguments: index and alias')
  process.exit(1)
}

const index = processArguments[0]
const alias = processArguments[1]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  await openSearchService.createAlias(index as OpenSearchIndex, alias)
  process.exit(0)
})
