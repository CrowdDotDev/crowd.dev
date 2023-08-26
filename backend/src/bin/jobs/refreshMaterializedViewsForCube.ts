import { Logger, logExecutionTimeV2 } from '@crowd/logging'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'

let processing = false

const job: CrowdJob = {
  name: 'Refresh Materialized View For Cube',
  cronTime: '1,31 * * * *',
  onTrigger: async (log: Logger) => {
    if (!processing) {
      processing = true
    } else {
      return
    }
    const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()

    const materializedViews = [
      'mv_members_cube',
      'mv_activities_cube',
      'mv_organizations_cube',
      'mv_segments_cube',
    ]

    for (const view of materializedViews) {
      await logExecutionTimeV2(
        () =>
          dbOptions.database.sequelize.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY "${view}"`),
        log,
        `Refresh Materialized View ${view}`,
      )
    }

    processing = false
  },
}

export default job
