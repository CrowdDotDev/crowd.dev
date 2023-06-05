import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerIntegrationProcessMessage } from '../../types/mq/nodeWorkerIntegrationProcessMessage'
import IntegrationRunRepository from '../../database/repositories/integrationRunRepository'
import IntegrationStreamRepository from '../../database/repositories/integrationStreamRepository'

/* eslint-disable no-console */

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'stream',
    alias: 's',
    typeLabel: '{underline streamId}',
    type: String,
    description:
      'The unique ID of integration stream that you would like to process. Use comma delimiter when sending multiple integration streams.',
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
    header: 'Process integration stream',
    content: 'Trigger processing of integration stream.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help && !parameters.stream) {
  console.log(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    const streamRepo = new IntegrationStreamRepository(options)
    const runRepo = new IntegrationRunRepository(options)

    const streamIds = parameters.stream.split(',')
    for (const streamId of streamIds) {
      const stream = await streamRepo.findById(streamId)

      if (!stream) {
        log.error({ streamId }, 'Integration stream not found!')
        process.exit(1)
      } else {
        log.info({ streamId }, 'Integration stream found! Triggering SQS message!')

        const run = await runRepo.findById(stream.runId)

        await sendNodeWorkerMessage(
          run.tenantId,
          new NodeWorkerIntegrationProcessMessage(run.id, stream.id),
        )
      }
    }

    process.exit(0)
  })
}
