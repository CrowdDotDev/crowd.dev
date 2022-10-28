import cronGenerator from 'cron-time-generator'
import { QueryTypes } from 'sequelize/types'
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

    const results = await dbOptions.database.sequelize.query(
      `
    select relname, relkind
    from pg_class
    where relname = 'member_last_activity_timestamp'
      and relkind = 'm'
    `,
      { type: QueryTypes.SELECT },
    )

    if (results.length === 1) {
      await dbOptions.database.sequelize.query(
        'refresh materialized view concurrently member_last_activity_timestamp',
      )
    }

    processing = false
  },
}

export default job
