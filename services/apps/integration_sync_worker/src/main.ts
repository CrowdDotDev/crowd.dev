import { LOGGING_IOC, Logger } from '@crowd/logging'
import { APP_IOC_MODULE, IOC } from './ioc'
import { APP_IOC } from './ioc_constants'
import { WorkerQueueReceiver } from './queue'

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  await APP_IOC_MODULE(MAX_CONCURRENT_PROCESSING)
  const log = IOC.get<Logger>(LOGGING_IOC.logger)

  log.info('Starting integration sync worker...')

  const worker = IOC.get<WorkerQueueReceiver>(APP_IOC.queueWorker)

  try {
    await worker.start()
  } catch (err) {
    log.error(err, 'Failed to start!')
    process.exit(1)
  }
})
