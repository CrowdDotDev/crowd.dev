import { OpenSearchService } from '../service/opensearch.service'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 2) {
  log.error('Expected 2 arguments: indexNameWithVersion and alias')
  process.exit(1)
}

const index = processArguments[0]
const alias = processArguments[1]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)

  // check index name is with version
  if (!index.includes('_v')) {
    log.error('Index name must include version')
    process.exit(1)
  }

  await openSearchService.removeAlias(index, alias)

  log.info(`Alias ${alias} is set to ${index}!`)

  process.exit(0)
})
