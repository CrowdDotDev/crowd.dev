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
    log.error('Expected 1 argument: resultIds')
    process.exit(1)
  }

  const resultIds = processArguments[0].split(',')

  const sqsClient = ioc.get<SqsClient>(SQS_IOC.client)
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

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
