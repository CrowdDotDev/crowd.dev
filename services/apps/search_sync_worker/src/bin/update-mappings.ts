import { APP_IOC_MODULE } from '../ioc'
import { APP_IOC } from '../ioc_constants'
import { OpenSearchService } from '../service/opensearch.service'
import { OpenSearchIndex } from '../types'
import { IOC } from '@crowd/ioc'

setImmediate(async () => {
  await APP_IOC_MODULE(2)
  const ioc = IOC()

  const openSearchService = ioc.get<OpenSearchService>(APP_IOC.openseachService)

  await openSearchService.initialize()
  await openSearchService.setIndexMappings(OpenSearchIndex.MEMBERS)
  await openSearchService.setIndexMappings(OpenSearchIndex.ACTIVITIES)
  process.exit(0)
})
