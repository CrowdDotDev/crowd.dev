import { DB_CONFIG, SQS_CONFIG } from '../conf'
import { getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, getSqsClient } from '@crowd/sqs'

const BATCH_SIZE = 100

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: integrationId')
  process.exit(1)
}

const integrationId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())

  const emitter = new IntegrationStreamWorkerEmitter(sqsClient, tracer, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())

  let results = await dbConnection.any(
    `
    select s.id
    from integration.streams s
    where state in ('error', 'pending', 'processing')
    and s."integrationId" = $(integrationId)
    order by s.id
    limit ${BATCH_SIZE};
    `,
    {
      integrationId,
    },
  )

  let count = 0
  while (results.length > 0) {
    for (const result of results) {
      await emitter.triggerStreamProcessing(result.id, result.id, result.id)
    }
    count += results.length
    log.info(`Processed total of ${count} streams for integration ${integrationId}!`)

    results = await dbConnection.any(
      `
      select s.id
      from integration.streams s
      where state in ('error', 'pending', 'processing')
        and s."integrationId" = $(integrationId)
         and s.id > $(lastId)
      order by s.id
      limit ${BATCH_SIZE};
        `,
      {
        lastId: results[results.length - 1].id,
        integrationId,
      },
    )
  }

  process.exit(0)
})
