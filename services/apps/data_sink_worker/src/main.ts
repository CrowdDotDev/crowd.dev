import { LOGGING_IOC, Logger } from '@crowd/logging'
import { initializeSentimentAnalysis } from '@crowd/sentiment'
import { SENTIMENT_CONFIG } from './conf'
import { APP_IOC_MODULE, IOC } from './ioc'
import { APP_IOC } from './ioc_constants'
import { WorkerQueueReceiver } from './queue'

const MAX_CONCURRENT_PROCESSING = 3

setImmediate(async () => {
  await APP_IOC_MODULE(MAX_CONCURRENT_PROCESSING)
  const log = IOC.get<Logger>(LOGGING_IOC.logger)

  log.info('Starting data sink worker...')

  if (SENTIMENT_CONFIG()) {
    initializeSentimentAnalysis(SENTIMENT_CONFIG())
  }

  const queue = IOC.get<WorkerQueueReceiver>(APP_IOC.queueWorker)

  try {
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
