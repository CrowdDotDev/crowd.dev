/**
 * Entry point: Start Temporal worker + transformer consumer loop.
 */

import { svc } from './main'
import { createTransformerConsumer } from './consumer/transformerConsumer'

setImmediate(async () => {
  await svc.init()

  // Start the transformer consumer (polls DB, runs transformations)
  const consumer = await createTransformerConsumer()
  consumer.start()

  // TODO: Set up signal handlers for graceful shutdown
  // process.on('SIGINT', () => consumer.stop())
  // process.on('SIGTERM', () => consumer.stop())

  await svc.start()
})
