import { SQS_CONFIG } from '@/conf'
import { getServiceLogger } from '@crowd/logging'
import { SearchSyncWorkerEmitter, getSqsClient } from '@crowd/sqs'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: organizationId')
  process.exit(1)
}

const organizationId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new SearchSyncWorkerEmitter(sqsClient, log)
  await emitter.init()

  await emitter.triggerOrganizationSync('blabla', organizationId)

  process.exit(0)
})
