import { partition } from '@crowd/common'
import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { DataSinkWorkerEmitter, SQS_IOC, SqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'
import { APP_IOC_MODULE } from 'ioc'
import DataSinkRepository from '../repo/dataSink.repo'

const MAX_TO_PROCESS = 500

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: numResults')
    process.exit(1)
  }

  let numResults = parseInt(processArguments[0], 10)

  numResults = Math.min(numResults, MAX_TO_PROCESS)
  const sqsClient = ioc.get<SqsClient>(SQS_IOC.client)
  const emitter = new DataSinkWorkerEmitter(sqsClient, log)
  await emitter.init()

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const repo = new DataSinkRepository(store, log)

  const results = await repo.getFailedResults(1, numResults)

  if (results.length === 0) {
    log.info('No results to restart.')
    process.exit(0)
  }

  await repo.resetResults(results.map((r) => r.id))

  const messages = results.map((r) => {
    return {
      payload: new ProcessIntegrationResultQueueMessage(r.id),
      groupId: r.id,
      deduplicationId: r.id,
    }
  })

  const batches = partition(messages, 10)
  for (const batch of batches) {
    await emitter.sendMessages(batch)
  }

  log.info(`Restarted total of ${results.length} failed results.`)
})
