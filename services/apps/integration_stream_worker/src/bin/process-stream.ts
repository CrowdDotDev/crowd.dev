import { SQS_CONFIG } from '@/conf'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, getSqsClient } from '@crowd/sqs'

const log = getServiceLogger()

const processArguments = process.argv.slice(3)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: streamId')
  process.exit(1)
}

const streamId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationStreamWorkerEmitter(sqsClient, log)
  await emitter.init()

  await emitter.triggerStreamProcessing(
    '38e57e57-a3b0-4b22-a858-b01aca9fcfa7',
    'linkedin',
    streamId,
  )
})
