import { DATABASE_IOC, DbConnection } from '@crowd/database'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, SQS_IOC } from '@crowd/sqs'
import { APP_IOC_MODULE } from 'ioc'

const BATCH_SIZE = 100

setImmediate(async () => {
  const ioc = await APP_IOC_MODULE(3)

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const emitter = ioc.get<IntegrationStreamWorkerEmitter>(SQS_IOC.emitters.integrationStreamWorker)

  const dbConnection = ioc.get<DbConnection>(DATABASE_IOC.connection)

  let results = await dbConnection.any(
    `
    select s.id
    from integration.streams s
    where state in ('error', 'pending', 'processing')
    order by s.id
    limit ${BATCH_SIZE};
    `,
  )

  let count = 0
  while (results.length > 0) {
    for (const result of results) {
      await emitter.triggerStreamProcessing(result.id, result.id, result.id)
    }
    count += results.length
    log.info(`Processed total of ${count} streams!`)

    results = await dbConnection.any(
      `
      select s.id
      from integration.streams s
      where state in ('error', 'pending', 'processing')
         and s.id > $(lastId)
      order by s.id
      limit ${BATCH_SIZE};
        `,
      {
        lastId: results[results.length - 1].id,
      },
    )
  }

  process.exit(0)
})
