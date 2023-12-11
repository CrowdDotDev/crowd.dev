import { OpenSearchService } from '@crowd/opensearch'
import { getServiceLogger } from '@crowd/logging'
import { OPENSEARCH_CONFIG } from 'conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 2) {
  log.error('Expected 2 arguments: sourceIndex and targetIndex')
  process.exit(1)
}

const sourceIndex = processArguments[0]
const targetIndex = processArguments[1]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const result = await openSearchService.reIndex(sourceIndex, targetIndex)
  console.log('ReIndex has been started...')
  console.log('ReIndex Task ID:', result) // This will log the return Task ID
  process.exit(0)
})
