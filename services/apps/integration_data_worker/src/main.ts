import { LOGGING_IOC, Logger } from '@crowd/logging'
import { APP_IOC_MODULE } from './ioc'
import { WorkerQueueReceiver } from './queue'
import { APP_IOC } from './ioc_constants'
import { IOC } from '@crowd/ioc'
import { processOldDataJob } from './jobs/processOldData'

const MAX_CONCURRENT_PROCESSING = 2
const PROCESSING_INTERVAL_MINUTES = 5

setImmediate(async () => {
  await APP_IOC_MODULE(MAX_CONCURRENT_PROCESSING)
  const ioc = IOC()
  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  log.info('Starting integration data worker...')

  const queue = ioc.get<WorkerQueueReceiver>(APP_IOC.queueWorker)

  try {
    let processing = false
    setInterval(async () => {
      try {
        if (!processing) {
          processing = true
          await processOldDataJob()
        }
      } catch (err) {
        log.error(err, 'Failed to process old data!')
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
