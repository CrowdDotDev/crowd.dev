import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import { DataSinkWorkerEmitter } from '@crowd/sqs'
import DataSinkRepository from '@/repo/dataSink.repo'
import { processPaginated } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(3)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: runId')
  process.exit(1)
}

const runId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new DataSinkRepository(store, log)

  await repo.transactionally(async (txRepo) => {
    await processPaginated(
      async (page) => {
        return txRepo.getFailedResults(runId, page, 20)
      },
      async (results) => {
        await txRepo.resetFailedResults(results.map((r) => r.id))

        for (const result of results) {
          await emitter.sendMessage(
            `results-${result.tenantId}-${result.platform}`,
            new ProcessIntegrationResultQueueMessage(result.id),
          )
        }
      },
    )
  })
})
