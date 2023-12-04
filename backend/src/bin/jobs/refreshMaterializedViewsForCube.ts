import { Logger, logExecutionTimeV2 } from '@crowd/logging'
import { QueryTypes } from 'sequelize'
import { CrowdJob } from '../../types/jobTypes'
import { databaseInit } from '../../database/databaseConnection'

function createRefreshQuery(view: string) {
  return `REFRESH MATERIALIZED VIEW CONCURRENTLY "${view}"`
}

const job: CrowdJob = {
  name: 'Refresh Materialized View For Cube',
  cronTime: '1,31 * * * *',
  onTrigger: async (log: Logger) => {
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
        const refreshQuery = createRefreshQuery(view)
        const runningQuery = await database.sequelize.query(
          `
            SELECT 1
            FROM pg_stat_activity
            WHERE query = :refreshQuery
              AND state != 'idle'
              AND pid != pg_backend_pid()
          `,
          {
            replacements: {
              refreshQuery,
            },
            type: QueryTypes.SELECT,
            useMaster: true,
          },
        )

        if (runningQuery.length > 0) {
          log.warn(
            `Materialized views for cube will not be refreshed because there's already an ongoing refresh of ${view}!`,
          )
          return
        }
      }
      for (const view of materializedViews) {
        const refreshQuery = createRefreshQuery(view)
        await logExecutionTimeV2(
          () =>
            database.sequelize.query(refreshQuery, {
              useMaster: true,
            }),
          log,
          `Refresh Materialized View ${view}`,
        )
      }
    } catch (e) {
      log.error({ error: e }, `Error while refreshing materialized views!`)
    }
  },
}

export default job
