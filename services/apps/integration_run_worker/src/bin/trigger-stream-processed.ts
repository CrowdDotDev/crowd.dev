import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { StreamProcessedQueueMessage } from '@crowd/types'
import { getUnleashClient } from '@crowd/feature-flags'
import { DbStore, getDbConnection } from '@crowd/database'
import { getRedisClient } from '@crowd/redis'
import {
  IntegrationRunWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: runIds')
  process.exit(1)
}

const runIds = processArguments[0].split(',')

setImmediate(async () => {
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(sqsClient, redis, tracer, unleash, loader, log)
  await emitter.init()

  const results = await dbConnection.any(
    `select id, "tenantId" from integration.runs where id in ($runIds:csv)`,
    {
      runIds,
    },
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const res of results as any[]) {
    await emitter.sendMessage(res.tenantId, res.id, new StreamProcessedQueueMessage(res.id))
  }
})
