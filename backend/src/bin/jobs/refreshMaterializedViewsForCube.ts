import { Logger, logExecutionTimeV2 } from '@crowd/logging'
import { CrowdJob } from '../../types/jobTypes'
import { databaseInit } from '../../database/databaseConnection'

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

    // initialize database with 15 minutes timeout
    const database = await databaseInit(1000 * 60 * 15)

    const materializedViews = [
      'mv_members_cube',
      'mv_activities_cube',
      'mv_organizations_cube',
      'mv_segments_cube',
    ]

    for (const view of materializedViews) {
      await logExecutionTimeV2(
        () =>
          database.sequelize.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY "${view}"`, {
            useMaster: true,
          }),
        log,
        `Refresh Materialized View ${view}`,
      )
    }

    processing = false
  },
}

export default job
