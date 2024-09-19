import { getServiceChildLogger } from '@crowd/logging'
import cronGenerator from 'cron-time-generator'
import { timeout } from '@crowd/common'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'
import IntegrationService from '../../services/integrationService'

const log = getServiceChildLogger('refreshGithubRepoSettings')

const job: CrowdJob = {
  name: 'Refresh Github repo settings',
  // every day
  cronTime: cronGenerator.every(1).days(),
  onTrigger: async () => {
    log.info('Updating Github repo settings.')
    const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

    interface Integration {
      id: string
      tenantId: string
      integrationIdentifier: string
    }

    const githubIntegrations = await dbOptions.database.sequelize.query(
      `SELECT id, "tenantId", "integrationIdentifier" FROM integrations 
       WHERE platform = 'github' AND "deletedAt" IS NULL
       AND "createdAt" < NOW() - INTERVAL '1 day'`,
    )

    for (const integration of githubIntegrations[0] as Integration[]) {
      log.info(`Updating repo settings for Github integration: ${integration.id}`)

      try {
        const options = await SequelizeRepository.getDefaultIRepositoryOptions()
        options.currentTenant = { id: integration.tenantId }

        const integrationService = new IntegrationService(options)
        // newly discovered repos will be mapped to default segment of the integration
        await integrationService.updateGithubIntegrationSettings(integration.integrationIdentifier)

        log.info(`Successfully updated repo settings for Github integration: ${integration.id}`)
      } catch (err) {
        log.error(
          `Error updating repo settings for Github integration ${integration.id}: ${err.message}`,
        )
      } finally {
        await timeout(1000)
      }
    }

    log.info('Finished updating Github repo settings.')
  },
}

export default job
