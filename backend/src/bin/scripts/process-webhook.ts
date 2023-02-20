import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { createServiceLogger } from '../../utils/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import IncomingWebhookRepository from '../../database/repositories/incomingWebhookRepository'
import { WebhookState } from '../../types/webhooks'
import { NodeWorkerProcessWebhookMessage } from '../../types/mq/nodeWorkerProcessWebhookMessage'

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = createServiceLogger()

const options = [
  {
    name: 'webhook',
    alias: 'w',
    typeLabel: '{underline webhookId}',
    type: String,
    description:
      'The unique ID of webhook that you would like to process. Use comma delimiter when sending multiple webhooks.',
  },
  {
    name: 'force',
    alias: 'f',
    typeLabel: '{underline force}',
    type: Boolean,
    defaultOption: false,
    description: 'Force processing of webhooks.',
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
    content: banner,
    raw: true,
  },
  {
    header: 'Process Webhook',
    content: 'Trigger processing of webhooks.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.webhook) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const webhookIds = parameters.webhook.split(',')
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new IncomingWebhookRepository(options)

    for (const webhookId of webhookIds) {
      const webhook = await repo.findById(webhookId)

      if (!webhook) {
        log.error({ webhookId }, 'Webhook not found!')
        process.exit(1)
      } else if (!parameters.force && webhook.state !== WebhookState.PENDING) {
        log.error({ webhookId }, 'Webhook is not in pending state!')
        process.exit(1)
      } else {
        log.info({ webhookId }, 'Webhook found - triggering SQS message!')
        await sendNodeWorkerMessage(
          webhook.tenantId,
          new NodeWorkerProcessWebhookMessage(webhook.tenantId, webhook.id, parameters.force),
        )
      }
    }
    process.exit(0)
  })
}
