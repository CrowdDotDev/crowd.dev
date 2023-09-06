import { OpenSearchService } from '@/service/opensearch.service'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: index')
  process.exit(1)
}

const index = processArguments[0]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  await openSearchService.deleteIndex(index)
  process.exit(0)
})
