import { timeout } from '@crowd/common'
import { DATABASE_IOC, DbConnection } from '@crowd/database'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { WebhookType } from '@crowd/types'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import { APP_IOC_MODULE } from 'ioc'
import { APP_IOC } from 'ioc_constants'
import IntegrationStreamService from '../service/integrationStreamService'

const BATCH_SIZE = 100
const MAX_CONCURRENT = 3

const options = [
  {
    name: 'tenant',
    alias: 't',
    type: String,
    description: 'The unique ID of tenant.',
  },
  {
    name: 'type',
    alias: 'p',
    type: String,
    description: 'Webhook type.',
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

if (parameters.help || (!parameters.tenant && !parameters.type)) {
  console.log(usage)
  process.exit(1)
}

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
  const ioc = await APP_IOC_MODULE(MAX_CONCURRENT)
  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const dbConnection = ioc.get<DbConnection>(DATABASE_IOC.connection)
  const service = ioc.get<IntegrationStreamService>(APP_IOC.streamService)

  const conditions = [
    `state in ('PENDING', 'ERROR') and type not in ('${WebhookType.DISCOURSE}', '${WebhookType.CROWD_GENERATED}')`,
  ]
  const params: Record<string, unknown> = {}

  if (parameters.tenant) {
    conditions.push(`"tenantId" = $(tenantId)`)
    params.tenantId = parameters.tenant
  }

  let results = await dbConnection.any(
    `
    select id
    from "incomingWebhooks"
    where ${conditions.join(' and ')}
    order by 
    case when state = 'PENDING' then 1
    else 2
    end,
    id
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
      where ${conditions.join(' and ')}
      and id > $(lastId)
      order by
      case when state = 'PENDING' then 1
      else 2
      end,
      id
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
