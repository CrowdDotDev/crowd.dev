import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationRunWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { StreamProcessedQueueMessage } from '@crowd/types'
import { APP_IOC_MODULE } from 'ioc'
import { SQS_CONFIG } from '../conf'

setImmediate(async () => {
  await APP_IOC_MODULE(2)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: streamIds')
    process.exit(1)
  }

  const runIds = processArguments[0].split(',')

  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(sqsClient, log)
  await emitter.init()

  for (const runId of runIds) {
    await emitter.sendMessage(runId, new StreamProcessedQueueMessage(runId))
  }
})
