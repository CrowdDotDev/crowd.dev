import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { DataSinkWorkerEmitter, SQS_IOC, SqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'
import { APP_IOC_MODULE } from 'ioc'
import DataSinkRepository from '../repo/dataSink.repo'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: runId')
    process.exit(1)
  }

  const runId = processArguments[0]

  const sqsClient = ioc.get<SqsClient>(SQS_IOC.client)
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const repo = new DataSinkRepository(store, log)

  let results = await repo.getFailedResultsForRun(runId, 1, 20)
  while (results.length > 0) {
    await repo.resetResults(results.map((r) => r.id))

    for (const result of results) {
      await emitter.sendMessage(
        `results-${result.tenantId}-${result.platform}`,
        new ProcessIntegrationResultQueueMessage(result.id),
      )
    }

    results = await repo.getFailedResultsForRun(runId, 1, 20)
  }
})
