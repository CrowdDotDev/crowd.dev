import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationRunState } from '@crowd/types'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerIntegrationProcessMessage } from '../../types/mq/nodeWorkerIntegrationProcessMessage'
import IntegrationRunRepository from '../../database/repositories/integrationRunRepository'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'run',
    alias: 'r',
    typeLabel: '{underline runId}',
    type: String,
    description:
      'The unique ID of integration run that you would like to continue processing. Use comma delimiter when sending multiple integration runs.',
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
    header: 'Continue Processing Integration Run',
    content: 'Trigger processing of integration run.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help && !parameters.run) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const fireCrowdWebhooks = !parameters.disableFiringCrowdWebhooks

    const runRepo = new IntegrationRunRepository(options)

    const runIds = parameters.run.split(',')
    for (const runId of runIds) {
      const run = await runRepo.findById(runId)

      if (!run) {
        log.error({ runId }, 'Integration run not found!')
        process.exit(1)
      } else {
        await log.info({ runId }, 'Integration run found - triggering SQS message!')

        if (run.state !== IntegrationRunState.PENDING) {
          log.warn(
            { currentState: run.state },
            `Setting integration state to ${IntegrationRunState.PENDING}!`,
          )
          await runRepo.restart(run.id)
        }

        if (!fireCrowdWebhooks) {
          log.info(
            'fireCrowdWebhooks is false - This continue-run will not trigger outgoing crowd webhooks!',
          )
        }

        await sendNodeWorkerMessage(
          run.tenantId,
          new NodeWorkerIntegrationProcessMessage(run.id, null, fireCrowdWebhooks),
        )
      }
    }

    process.exit(0)
  })
}
