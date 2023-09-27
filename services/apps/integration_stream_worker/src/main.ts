import { LOGGING_IOC, Logger } from '@crowd/logging'
import { APP_IOC_MODULE } from './ioc'
import { WorkerQueueReceiver } from './queue'
import { APP_IOC } from './ioc_constants'
import { IOC } from '@crowd/ioc'

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  await APP_IOC_MODULE(MAX_CONCURRENT_PROCESSING)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)
  log.info('Starting integration stream worker...')

  const queue = ioc.get<WorkerQueueReceiver>(APP_IOC.queueWorker)

  try {
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
