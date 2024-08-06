import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import * as fs from 'fs'
import path from 'path'
import { getServiceLogger } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import IntegrationService from '@/services/integrationService'

const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8')

const log = getServiceLogger()

const options = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
  {
    name: 'installId',
    alias: 'i',
    type: String,
    description: 'The GitHub installation ID to update.',
  },
  {
    name: 'tenantId',
    alias: 't',
    type: String,
    description: 'The tenant ID to use for the operation.',
  },
]

const sections = [
  {
    content: banner,
    raw: true,
  },
  {
    header: 'Update GitHub Install Settings',
    content: 'Updates the settings for a GitHub installation.',
  },
  {
    header: 'Options',
    optionList: options,
  },
]

const usage = commandLineUsage(sections)
const parameters = commandLineArgs(options)

if (parameters.help || !parameters.installId || !parameters.tenantId) {
  log.info(usage)
} else {
  setImmediate(async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    options.currentTenant = { id: parameters.tenantId }

    try {
      const integrationService = new IntegrationService(options)
      await integrationService.updateGithubIntegrationSettings(parameters.installId)

      log.info(`Successfully updated GitHub integration settings for install ID: ${parameters.installId}`)
    } catch (error) {
      log.error(`Error updating GitHub integration settings`, error)
    }

    process.exit(0)
  })
}