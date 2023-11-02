import { Logger, logExecutionTimeV2 } from '@crowd/logging'
import { CrowdJob } from '../../types/jobTypes'
import { databaseInit } from '../../database/databaseConnection'

let processingRefreshCubeMVs = false

const job: CrowdJob = {
  name: 'Refresh Materialized View For Cube',
  cronTime: '1,31 * * * *',
  onTrigger: async (log: Logger) => {
    if (!processingRefreshCubeMVs) {
      processingRefreshCubeMVs = true
    } else {
      log.warn(
        "Materialized views will not be refreshed because there's already an ongoing refresh!",
      )
      return
    }

    try {
      // initialize database with 15 minutes query timeout
      const forceNewDbInstance = true
      const database = await databaseInit(1000 * 60 * 15, forceNewDbInstance)

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
    } catch (e) {
      log.error({ error: e }, `Error while refreshing materialized views!`)
    } finally {
      processingRefreshCubeMVs = false
    }
  },
}

export default job
