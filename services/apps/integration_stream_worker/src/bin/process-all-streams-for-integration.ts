import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import IntegrationStreamService from '../service/integrationStreamService'
import { timeout } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { getSqsClient } from '@crowd/sqs'
import { IntegrationStreamState } from '@crowd/types'
import {
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'

const BATCH_SIZE = 100
const MAX_CONCURRENT = 1

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: integrationId')
  process.exit(1)
}

const integrationId = processArguments[0]

async function processStream(
  streamId: string,
  service: IntegrationStreamService,
): Promise<boolean> {
  try {
    return await service.processStream(streamId)
  } catch (err) {
    return false
  }
}

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const dataWorkerEmitter = new IntegrationDataWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )

  await runWorkerEmiiter.init()
  await dataWorkerEmitter.init()
  await streamWorkerEmitter.init()

  const service = new IntegrationStreamService(
    redisClient,
    runWorkerEmiiter,
    dataWorkerEmitter,
    streamWorkerEmitter,
    store,
    log,
  )

  let results = await dbConnection.any(
    `
    select id
    from integration.streams
    where state in ('${IntegrationStreamState.ERROR}', '${IntegrationStreamState.PENDING}')
    and "integrationId" = '${integrationId}'
    order by id
    limit ${BATCH_SIZE};
    `,
  )

  let current = 0
  let total = 0
  let errors = 0
  while (results.length > 0) {
    for (const result of results) {
      while (current == MAX_CONCURRENT) {
        await timeout(1000)
      }
      const streamId = result.id

      log.info(`Processing stream ${streamId}!`)

      current++
      processStream(streamId, service).then((res) => {
        current--
        if (res) {
          total++
        } else {
          errors++
        }

        log.info({ res }, `Processed ${total} streams successfully so far! ${errors} errors!`)
      })
    }

    results = await dbConnection.any(
      `
      select id
      from integration.streams
      where state in ('${IntegrationStreamState.ERROR}', '${IntegrationStreamState.PENDING}')
      and id > $(lastId)
      and "integrationId" = '${integrationId}'
      order by id
      limit ${BATCH_SIZE};
      `,
      {
        lastId: results[results.length - 1].id,
      },
    )
  }

  while (current > 0) {
    await timeout(1000)
  }

  process.exit(0)
})
