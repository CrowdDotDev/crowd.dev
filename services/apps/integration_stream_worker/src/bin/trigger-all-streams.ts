import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import { getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, getSqsClient } from '@crowd/sqs'

const BATCH_SIZE = 100

const log = getServiceLogger()

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())

  const emitter = new IntegrationStreamWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())

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
