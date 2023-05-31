import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { createServiceLogger } from '../../utils/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import IncomingWebhookRepository from '../../database/repositories/incomingWebhookRepository'
import { WebhookState, WebhookType } from '../../types/webhooks'
import { NodeWorkerProcessWebhookMessage } from '../../types/mq/nodeWorkerProcessWebhookMessage'
import { sqs, getCurrentQueueSize } from '../../services/aws'
import { SQS_CONFIG } from '../../config'
import { timeout } from '../../utils/timing'
import { WebhookProcessor } from '../../serverless/integrations/services/webhookProcessor'

/* eslint-disable no-console */

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
    name: 'processPlatformErrors',
    alias: 'p',
    typeLabel: '{underline processPlatformErrors}',
    type: String,
    defaultOption: false,
    description: `Retry error state webhooks in specified platform. Currently supported: ['github', 'discord'].`,
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

if (parameters.help || (!parameters.webhook && !parameters.processPlatformErrors)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new IncomingWebhookRepository(options)
    let currentPage = 1
    const PROCESS_QUEUE_THRESHOLD = 100
    const PAGE_SIZE = 1000

    if (parameters.processPlatformErrors) {
      let webhookType: WebhookType

      if (parameters.processPlatformErrors === 'github') {
        webhookType = WebhookType.GITHUB
      } else if (parameters.processPlatformErrors === 'discord') {
        webhookType = WebhookType.DISCORD
      } else {
        console.log(usage)
        process.exit(0)
      }

      log.debug('Processing error state webhooks!')
      let webhooks = await repo.findError(
        currentPage,
        PAGE_SIZE,
        WebhookProcessor.MAX_RETRY_LIMIT,
        webhookType,
      )

      log.info(webhooks.map((w) => w.id))

      while (webhooks.length > 0) {
        for (const webhook of webhooks) {
          log.info({ webhook }, 'Webhook found - triggering SQS message!')
          await sendNodeWorkerMessage(
            webhook.tenantId,
            new NodeWorkerProcessWebhookMessage(webhook.tenantId, webhook.id, true, false),
          )
        }

        // no need to process further if result isn't same as page size
        if (webhooks.length < PAGE_SIZE) {
          log.info('Finished processing.')
          break
        }

        let queueSize = await getCurrentQueueSize(sqs, SQS_CONFIG.nodejsWorkerQueue)

        // ensure queueSize before sending new page message
        while (queueSize > PROCESS_QUEUE_THRESHOLD) {
          log.info(
            `Queue size(${queueSize}) is bigger than threshold(${PROCESS_QUEUE_THRESHOLD}), waiting 30 seconds before retrying.`,
          )
          await timeout(30000)
          queueSize = await getCurrentQueueSize(sqs, SQS_CONFIG.nodejsWorkerQueue)
        }

        currentPage += 1

        log.info(
          `Queue size(${queueSize}) below threshold(${PROCESS_QUEUE_THRESHOLD}) - Continuing with page${currentPage}`,
        )

        webhooks = await repo.findError(
          currentPage,
          PAGE_SIZE,
          WebhookProcessor.MAX_RETRY_LIMIT,
          webhookType,
        )
      }
    } else {
      const webhookIds = parameters.webhook.split(',')

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
    }

    process.exit(0)
  })
}
