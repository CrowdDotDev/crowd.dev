import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { QueryTypes } from 'sequelize'
import { IntegrationProcessor } from '@/serverless/integrations/services/integrationProcessor'
import { REDIS_CONFIG } from '../../conf'
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
    name: 'tenant',
    alias: 't',
    typeLabel: '{underline tenantId}',
    type: String,
    description:
      'The unique ID of tenant that you would like to process. Use in combination with type.',
  },
  {
    name: 'type',
    alias: 'tp',
    typeLabel: '{underline type}',
    type: String,
    description: 'The webhook type to process. Use in combination with tenant.',
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

if (parameters.help || (!parameters.webhook && (!parameters.tenant || !parameters.type))) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const redisEmitter = await getRedisClient(REDIS_CONFIG)
    const integrationProcessorInstance = new IntegrationProcessor(options, redisEmitter)

    if (parameters.webhook) {
      const webhookIds = parameters.webhook.split(',')

      for (const webhookId of webhookIds) {
        log.info({ webhookId }, 'Webhook found - processing!')
        await integrationProcessorInstance.processWebhook(webhookId, true, true)
      }
    } else if (parameters.tenant && parameters.type) {
      const seq = SequelizeRepository.getSequelize(options)

      let ids = (
        await seq.query(
          `
        select id from "incomingWebhooks"
        where state in ('PENDING', 'ERROR')
        and "tenantId" = :tenantId and type = :type
        order by id
        limit 100
      `,
          {
            type: QueryTypes.SELECT,
            replacements: {
              tenantId: parameters.tenant,
              type: parameters.type,
            },
          },
        )
      ).map((r) => (r as any).id)

      while (ids.length > 0) {
        for (const webhookId of ids) {
          log.info({ webhookId }, 'Webhook found - processing!')
          await integrationProcessorInstance.processWebhook(webhookId, true, true)

          ids = (
            await seq.query(
              `
            select id from "incomingWebhooks"
            where state in ('PENDING', 'ERROR')
            and "tenantId" = :tenantId and type = :type
            and id > :id
            order by id
            limit 100
          `,
              {
                type: QueryTypes.SELECT,
                replacements: {
                  tenantId: parameters.tenant,
                  type: parameters.type,
                  id: ids[ids.length - 1],
                },
              },
            )
          ).map((r) => (r as any).id)
        }
      }
    }

    process.exit(0)
  })
}
