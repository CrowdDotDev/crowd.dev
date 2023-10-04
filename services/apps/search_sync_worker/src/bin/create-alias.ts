import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { APP_IOC_MODULE } from '../ioc'
import { APP_IOC } from '../ioc_constants'
import { OpenSearchService } from '../service/opensearch.service'

setImmediate(async () => {
  await APP_IOC_MODULE(2)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 2) {
    log.error('Expected 2 arguments: index and alias')
    process.exit(1)
  }

  const index = processArguments[0]
  const alias = processArguments[1]
  const openSearchService = ioc.get<OpenSearchService>(APP_IOC.openseachService)

  await openSearchService.createAlias(index, alias)
  process.exit(0)
})
