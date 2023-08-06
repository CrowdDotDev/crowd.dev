import { OpenSearchService } from '@/service/opensearch.service'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 2) {
  log.error('Expected 2 arguments: sourceIndex and targetIndex')
  process.exit(1)
}

const sourceIndex = processArguments[0]
const targetIndex = processArguments[1]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  await openSearchService.reIndex(sourceIndex, targetIndex)
  process.exit(0)
})
