import cronGenerator from 'cron-time-generator'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'

const job: CrowdJob = {
  name: 'Refresh Materialized Views',
  cronTime: cronGenerator.every(2).minutes(),
  onTrigger: async () => {
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()

    await options.database.sequelize.query(
      'refresh materialized view "memberActivityAggregatesMVs"',
    )
  },
}

export default job
