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
import { IntegrationStreamState } from '@crowd/types'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'

const BATCH_SIZE = 100
const MAX_CONCURRENT = 3

const log = getServiceLogger()

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant.',
  },
  {
    name: 'integration',
    alias: 'i',
    type: String,
    description: 'The unique ID of the integration.',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
]
const sections = [
  {
    header: 'Update tenant plan',
    content: 'Updates tenant plan.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

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

if (parameters.help || (!parameters.tenant && !parameters.integration)) {
  console.log(usage)
  process.exit(1)
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

  const conditions = [
    `state in ('${IntegrationStreamState.ERROR}', '${IntegrationStreamState.PENDING}')`,
  ]

  const params: Record<string, unknown> = {}

  if (parameters.tenant) {
    conditions.push(`"tenantId" = $(tenantId)`)
    params.tenantId = parameters.tenant
  }

  if (parameters.integration) {
    conditions.push(`"integrationId" = $(integrationId)`)
    params.integrationId = parameters.integration
  }

  let results = await dbConnection.any(
    `
    select id
    from integration.streams
    where ${conditions.join(' and ')}
    order by id
    limit ${BATCH_SIZE};
    `,
    params,
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
      where ${conditions.join(' and ')}
      and id > $(lastId)
      order by id
      limit ${BATCH_SIZE};
      `,
      Object.assign({}, params, {
        lastId: results[results.length - 1].id,
      }),
    )
  }

  while (current > 0) {
    await timeout(1000)
  }

  process.exit(0)
})
