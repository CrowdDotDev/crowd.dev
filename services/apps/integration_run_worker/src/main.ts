import { timeout } from '@crowd/common'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { WorkerQueueReceiver } from './queue'
import { SQS_CONFIG } from './config'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Starting integration run worker...')

  const client = getSqsClient(SQS_CONFIG())

  const queue = new WorkerQueueReceiver(client, log)

  try {
    await queue.start()

    while (true) {
      await timeout(500)
    }
  } catch (err) {
    log.error({ err }, 'Failed to start queue')
  }
})
