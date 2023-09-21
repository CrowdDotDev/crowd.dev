import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { IntegrationProcessor } from '@/serverless/integrations/services/integrationProcessor'
import { REDIS_CONFIG } from '../../conf'
import IncomingWebhookRepository from '../../database/repositories/incomingWebhookRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

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
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new IncomingWebhookRepository(options)
    const redisEmitter = await getRedisClient(REDIS_CONFIG)
    const integrationProcessorInstance = new IntegrationProcessor(options, redisEmitter)

    const webhookIds = parameters.webhook.split(',')

    for (const webhookId of webhookIds) {
      const webhook = await repo.findById(webhookId)

      if (!webhook) {
        log.error({ webhookId }, 'Webhook not found!')
        process.exit(1)
      } else {
        log.info({ webhookId }, 'Webhook found - processing!')
        await integrationProcessorInstance.processWebhook(webhookId, true, true)
      }
    }

    process.exit(0)
  })
}
