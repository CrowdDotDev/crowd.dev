import { CrowdJob } from '../../types/jobTypes'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import IntegrationRunRepository from '../../database/repositories/integrationRunRepository'

const MAX_MONTHS_TO_KEEP = 3

const job: CrowdJob = {
  name: 'Clean up old successful integration runs',
  // run once every week on Sunday at 1AM
  cronTime: '0 1 * * 0',
  onTrigger: async () => {
    const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new IntegrationRunRepository(dbOptions)

    await repo.cleanupOldRuns(MAX_MONTHS_TO_KEEP)
  },
}

export default job
