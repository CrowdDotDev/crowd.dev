import { getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, SQS_CONFIG } from './conf'
import { OpenSearchService } from './service/opensearch.service'
import { OpenSearchIndex } from './types'

const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting data sink worker...')

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const openSearchService = new OpenSearchService(log)
  await openSearchService.initialize()

  await openSearchService.index('1', OpenSearchIndex.TEST, {
    name: 'test',
  })
})
