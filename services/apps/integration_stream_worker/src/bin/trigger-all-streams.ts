import { IntegrationStreamWorkerEmitter } from '@crowd/common_services'
import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

const BATCH_SIZE = 100

const log = getServiceLogger()

setImmediate(async () => {
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())

  const emitter = new IntegrationStreamWorkerEmitter(queueClient, log)
  await emitter.init()

  let results = await dbConnection.any(
    `
    select s.id, r.onboarding
    from integration.streams s
    left join integration.runs r on r.id = s."runId"
    where state in ('error', 'pending', 'processing')
    order by s.id
    limit ${BATCH_SIZE};
    `,
  )

  let count = 0
  while (results.length > 0) {
    for (const result of results) {
      await emitter.triggerStreamProcessing(result.id, result.id, result.onboarding)
    }
    count += results.length
    log.info(`Processed total of ${count} streams!`)

    results = await dbConnection.any(
      `
      select s.id, r.onboarding
      from integration.streams s
      left join integration.runs r on r.id = s."runId"
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
