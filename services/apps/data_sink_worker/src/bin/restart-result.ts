import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import DataSinkRepository from '@/repo/dataSink.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { DataSinkWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: resultIds')
  process.exit(1)
}

const resultIds = processArguments[0].split(',')

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new DataSinkRepository(store, log)
  for (const resultId of resultIds) {
    const result = await repo.getResultInfo(resultId)
    if (!result) {
      log.error(`Result ${resultId} not found!`)
      process.exit(1)
    } else {
      await repo.resetResults([resultId])
      await emitter.sendMessage(
        `results-${result.tenantId}-${result.platform}`,
        new ProcessIntegrationResultQueueMessage(result.id),
      )
    }
  }
})
