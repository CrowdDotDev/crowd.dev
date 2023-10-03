import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { initializeSentimentAnalysis } from '@crowd/sentiment'
import { SENTIMENT_CONFIG } from './conf'
import { APP_IOC_MODULE } from './ioc'
import { APP_IOC } from './ioc_constants'
import { processOldResultsJob } from './jobs/processOldResults'
import { WorkerQueueReceiver } from './queue'

const MAX_CONCURRENT_PROCESSING = 3
const PROCESSING_INTERVAL_MINUTES = 5

setImmediate(async () => {
  await APP_IOC_MODULE(MAX_CONCURRENT_PROCESSING)
  const ioc = IOC()
  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  log.info('Starting data sink worker...')

  if (SENTIMENT_CONFIG()) {
    initializeSentimentAnalysis(SENTIMENT_CONFIG())
  }

  const queue = ioc.get<WorkerQueueReceiver>(APP_IOC.queueWorker)

  try {
    let processing = false
    setInterval(async () => {
      try {
        if (!processing) {
          processing = true
          await processOldResultsJob()
        }
      } catch (err) {
        log.error(err, 'Failed to process old results!')
      } finally {
        processing = false
      }
    }, PROCESSING_INTERVAL_MINUTES * 60 * 1000)
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
