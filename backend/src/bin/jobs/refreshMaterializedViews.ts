import cronGenerator from 'cron-time-generator'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'

let processing = false

const job: CrowdJob = {
  name: 'Refresh Materialized View',
  // every two hours
  cronTime: cronGenerator.every(2).minutes(),
  onTrigger: async () => {
    if (!processing) {
      processing = true
    } else {
      return
    }
    const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

    await dbOptions.database.sequelize.query(
      'refresh materialized view concurrently "memberActivityAggregatesMVs"',
    )

    processing = false
  },
}

export default job
