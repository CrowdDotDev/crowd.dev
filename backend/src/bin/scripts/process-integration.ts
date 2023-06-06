import { processPaginated, singleOrDefault } from '@crowd/common'
import { INTEGRATION_SERVICES } from '@crowd/integrations'
import { getServiceLogger } from '@crowd/logging'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import IntegrationRunRepository from '../../database/repositories/integrationRunRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { getIntegrationRunWorkerEmitter } from '../../serverless/utils/serviceSQS'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { IntegrationRunState } from '../../types/integrationRunTypes'
import { NodeWorkerIntegrationProcessMessage } from '../../types/mq/nodeWorkerIntegrationProcessMessage'

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

const triggerIntegrationRun = async (
  runRepo: IntegrationRunRepository,
  tenantId: string,
  integrationId: string,
  onboarding: boolean,
  fireCrowdWebhooks: boolean,
) => {
  const existingRun = await runRepo.findLastProcessingRun(integrationId)

  if (existingRun && existingRun.onboarding) {
    log.error('Integration is already processing, skipping!')
    return
  }

  log.info(
    { integrationId, onboarding },
    'Integration found - creating a new run in the old framework!',
  )
  const run = await runRepo.create({
    integrationId,
    tenantId,
    onboarding,
    state: IntegrationRunState.PENDING,
  })

  log.info(
    { integrationId, onboarding },
    'Triggering SQS message for the old framework integration!',
  )
  await sendNodeWorkerMessage(
    tenantId,
    new NodeWorkerIntegrationProcessMessage(run.id, null, fireCrowdWebhooks),
  )
}

const triggerNewIntegrationRun = async (
  tenantId: string,
  integrationId: string,
  platform: string,
  onboarding: boolean,
) => {
  log.info(
    { integrationId, onboarding },
    'Triggering SQS message for the new framework integration!',
  )

  const emitter = await getIntegrationRunWorkerEmitter()
  await emitter.triggerIntegrationRun(tenantId, platform, integrationId, onboarding)
}

if (parameters.help || (!parameters.integration && !parameters.platform)) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const onboarding = parameters.onboarding
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const fireCrowdWebhooks = !parameters.disableFiringCrowdWebhooks

    const runRepo = new IntegrationRunRepository(options)

    if (parameters.platform) {
      let inNewFramework = false

      if (singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === parameters.platform)) {
        inNewFramework = true
      }

      await processPaginated(
        async (page) => IntegrationRepository.findAllActive(parameters.platform, page, 10),
        async (integrations) => {
          for (const i of integrations) {
            const integration = i as any

            if (inNewFramework) {
              await triggerNewIntegrationRun(
                integration.tenantId,
                integration.id,
                integration.platform,
                onboarding,
              )
            } else {
              await triggerIntegrationRun(
                runRepo,
                integration.tenantId,
                integration.id,
                onboarding,
                fireCrowdWebhooks,
              )
            }
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

          let inNewFramework = false

          if (singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.platform)) {
            inNewFramework = true
          }

          if (inNewFramework) {
            await triggerNewIntegrationRun(
              integration.tenantId,
              integration.id,
              integration.platform,
              onboarding,
            )
          } else {
            await triggerIntegrationRun(
              runRepo,
              integration.tenantId,
              integration.id,
              onboarding,
              fireCrowdWebhooks,
            )
          }
        }
      }
    }

    process.exit(0)
  })
}
