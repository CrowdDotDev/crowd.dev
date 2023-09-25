import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from '@/conf'
import IntegrationStreamService from '@/service/integrationStreamService'
import { timeout } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import {
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  getSqsClient,
} from '@crowd/sqs'
import { IntegrationStreamState } from '@crowd/types'

const BATCH_SIZE = 100
const MAX_CONCURRENT = 3

const tracer = getServiceTracer()
const log = getServiceLogger()

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

  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(sqsClient, tracer, log)
  const dataWorkerEmitter = new IntegrationDataWorkerEmitter(sqsClient, tracer, log)
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(sqsClient, tracer, log)

  await runWorkerEmiiter.init()
  await dataWorkerEmitter.init()
  await streamWorkerEmitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

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
