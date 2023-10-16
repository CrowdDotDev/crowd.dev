import { SQS_CONFIG } from '../conf'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationRunWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { StreamProcessedQueueMessage } from '@crowd/types'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: streamIds')
  process.exit(1)
}

const runIds = processArguments[0].split(',')

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(sqsClient, tracer, log)
  await emitter.init()

  for (const runId of runIds) {
    await emitter.sendMessage(runId, new StreamProcessedQueueMessage(runId))
  }
})
