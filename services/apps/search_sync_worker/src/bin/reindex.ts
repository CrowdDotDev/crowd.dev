import { APP_IOC_MODULE } from '../ioc'
import { APP_IOC } from '../ioc_constants'
import { OpenSearchService } from '../service/opensearch.service'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'

setImmediate(async () => {
  await APP_IOC_MODULE(2)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 2) {
    log.error('Expected 2 arguments: sourceIndex and targetIndex')
    process.exit(1)
  }

  const sourceIndex = processArguments[0]
  const targetIndex = processArguments[1]
  const openSearchService = ioc.get<OpenSearchService>(APP_IOC.openseachService)

  const result = await openSearchService.reIndex(sourceIndex, targetIndex)
  console.log('ReIndex has been started...')
  console.log('ReIndex Task ID:', result) // This will log the return Task ID
  process.exit(0)
})
