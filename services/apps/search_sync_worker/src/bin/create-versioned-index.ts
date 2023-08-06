import { OpenSearchService } from '@/service/opensearch.service'
import { getServiceLogger } from '@crowd/logging'
import { OpenSearchIndex } from '@/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: index')
  process.exit(1)
}

const index = processArguments[0]
const version = 1

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  await openSearchService.createIndexWithVersion(index as OpenSearchIndex, version)
  process.exit(0)
})
