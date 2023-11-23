import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from '../conf'
import IntegrationStreamService from '../service/integrationStreamService'
import { timeout } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import {
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  getSqsClient,
} from '@crowd/sqs'
import { WebhookType } from '@crowd/types'

const BATCH_SIZE = 100
const MAX_CONCURRENT = 3

const log = getServiceLogger()

async function processWebhook(
  webhookId: string,
  service: IntegrationStreamService,
): Promise<boolean> {
  try {
    return await service.processWebhookStream(webhookId)
  } catch (err) {
    return false
  }
}

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())

  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(sqsClient, log)
  const dataWorkerEmitter = new IntegrationDataWorkerEmitter(sqsClient, log)
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(sqsClient, log)

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
    from "incomingWebhooks"
    where state in ('PENDING', 'ERROR') and type not in ('${WebhookType.DISCOURSE}', '${WebhookType.CROWD_GENERATED}')
    order by 
    case when state = 'PENDING' then 1
    else 2
    end,
    id
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
      const webhookId = result.id

      current++
      processWebhook(webhookId, service).then((res) => {
        current--

        if (res) {
          total++
        } else {
          errors++
        }

        log.info({ res }, `Processed ${total} webhooks successfully so far! ${errors} errors!`)
      })
    }

    results = await dbConnection.any(
      `
      select id
      from "incomingWebhooks"
      where state in ('PENDING', 'ERROR') and type not in ('${WebhookType.DISCOURSE}', '${WebhookType.CROWD_GENERATED}')
      and id > $(lastId)
      order by
      case when state = 'PENDING' then 1
      else 2
      end,
      id
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
