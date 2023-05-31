import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { processPaginated } from '@crowd/common'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerIntegrationProcessMessage } from '../../types/mq/nodeWorkerIntegrationProcessMessage'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import IntegrationRunRepository from '../../database/repositories/integrationRunRepository'
import { IntegrationRunState } from '../../types/integrationRunTypes'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'integration',
    alias: 'i',
    typeLabel: '{underline integrationId}',
    type: String,
    description:
      'The unique ID of integration that you would like to process. Use comma delimiter when sending multiple integrations.',
  },
  {
    name: 'onboarding',
    alias: 'o',
    description: 'Process integration as if it was onboarding.',
    type: Boolean,
    defaultValue: false,
  },
  {
    name: 'disableFiringCrowdWebhooks',
    alias: 'd',
    typeLabel: '{underline disableFiringCrowdWebhooks}',
    type: Boolean,
    defaultOption: false,
    description: 'Should it disable firing outgoing crowd webhooks?',
  },
  {
    name: 'platform',
    alias: 'p',
    description: 'The platform for which we should run all integrations.',
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
    header: 'Process Integration',
    content: 'Trigger processing of integrations.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || (!parameters.integration && !parameters.platform)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const onboarding = parameters.onboarding
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const fireCrowdWebhooks = !parameters.disableFiringCrowdWebhooks

    const runRepo = new IntegrationRunRepository(options)

    if (parameters.platform) {
      await processPaginated(
        async (page) => IntegrationRepository.findAllActive(parameters.platform, page, 10),
        async (integrations) => {
          for (const i of integrations) {
            const integration = i as any
            log.info({ integrationId: integration.id, onboarding }, 'Triggering SQS message!')

            const existingRun = await runRepo.findLastProcessingRun(integration.id)

            if (existingRun && existingRun.onboarding) {
              log.error('Integration is already processing, skipping!')
              return
            }

            const run = await runRepo.create({
              integrationId: integration.id,
              tenantId: integration.tenantId,
              onboarding,
              state: IntegrationRunState.PENDING,
            })

            await sendNodeWorkerMessage(
              integration.tenantId,
              new NodeWorkerIntegrationProcessMessage(run.id, null, fireCrowdWebhooks),
            )
          }
        },
      )
    } else {
      const integrationIds = parameters.integration.split(',')
      for (const integrationId of integrationIds) {
        const integration = await options.database.integration.findOne({
          where: { id: integrationId },
        })

        if (!integration) {
          log.error({ integrationId }, 'Integration not found!')
          process.exit(1)
        } else {
          log.info({ integrationId, onboarding }, 'Integration found - triggering SQS message!')

          const existingRun = await runRepo.findLastProcessingRun(integration.id)

          if (existingRun && existingRun.onboarding) {
            log.error('Integration is already processing, skipping!')
          } else {
            const run = await runRepo.create({
              integrationId: integration.id,
              tenantId: integration.tenantId,
              onboarding,
              state: IntegrationRunState.PENDING,
            })

            await sendNodeWorkerMessage(
              integration.tenantId,
              new NodeWorkerIntegrationProcessMessage(run.id, null, fireCrowdWebhooks),
            )
          }
        }
      }
    }

    process.exit(0)
  })
}
