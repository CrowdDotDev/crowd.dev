import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  IntegrationStreamWorkerEmitter,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'

const BATCH_SIZE = 100

const tracer = getServiceTracer()
const log = getServiceLogger()

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const emitter = new IntegrationStreamWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
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
      await emitter.triggerStreamProcessing(result.id, result.id, result.id, result.onboarding)
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
