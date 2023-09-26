import { LOGGING_IOC, Logger } from '@crowd/logging'
import { APP_IOC_MODULE, IOC } from './ioc'
import { WorkerQueueReceiver } from './queue'
import { APP_IOC } from './ioc_constants'

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  await APP_IOC_MODULE(MAX_CONCURRENT_PROCESSING)
  const log = IOC.get<Logger>(LOGGING_IOC.logger)

  log.info('Starting integration data worker...')

  const queue = IOC.get<WorkerQueueReceiver>(APP_IOC.queueWorker)

  try {
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
