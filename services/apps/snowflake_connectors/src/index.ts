/**
 * Entry point: Start Temporal worker + transformer consumer loop.
 */
import { getServiceChildLogger } from '@crowd/logging'

import { createTransformerConsumer } from './consumer/transformerConsumer'
import { svc } from './main'

const log = getServiceChildLogger('main')

setImmediate(async () => {
  await svc.init()

  const consumer = await createTransformerConsumer()
  consumer.start()

  const HARD_TIMEOUT_MS = 2 * 60 * 60 * 1000

  const shutdown = () => {
    log.info('Shutdown signal received, stopping consumer...')
    consumer.stop()

    setTimeout(() => {
      log.warn('Graceful shutdown timed out after 2 hours, forcing exit')
      process.exit(1)
    }, HARD_TIMEOUT_MS).unref()
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  await svc.start()
})
