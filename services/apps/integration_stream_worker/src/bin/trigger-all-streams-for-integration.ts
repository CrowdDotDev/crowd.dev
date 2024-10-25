import {
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

const BATCH_SIZE = 100

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: integrationId')
  process.exit(1)
}

const integrationId = processArguments[0]

setImmediate(async () => {
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const emitter = new IntegrationStreamWorkerEmitter(queueClient, redisClient, loader, log)
  await emitter.init()

  let results = await dbConnection.any(
    `
    select s.id, r.onboarding
    from integration.streams s
    left join integration.runs r on r.id = s."runId"
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
      await emitter.triggerStreamProcessing(result.id, result.id, result.id, result.onboarding)
    }
    count += results.length
    log.info(`Processed total of ${count} streams for integration ${integrationId}!`)

    results = await dbConnection.any(
      `
      select s.id, r.onboarding
      from integration.streams s
      left join integration.runs r on r.id = s."runId"
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
