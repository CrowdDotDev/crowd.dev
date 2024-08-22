import { Logger, getServiceChildLogger } from '@crowd/logging'
import { CrowdJob } from '../../types/jobTypes'
import { databaseInit } from '../../database/databaseConnection'
import { refreshMaterializedView } from './refreshMaterializedViews'

const job: CrowdJob = {
  name: 'Refresh Materialized View For Cube',
  cronTime: process.env.CROWD_MV_CUBEJS_REFRESH_PERIOD,
  onTrigger: async (log: Logger) => {
    const refreshed = []

    try {
      // initialize database with 15 minutes query timeout
      const database = await databaseInit(1000 * 60 * 15, true)
      const log = getServiceChildLogger('RefreshMVForCubeJob')

      const materializedViews = [
        'mv_members_cube',
        'mv_activities_cube',
        'mv_organizations_cube',
        'mv_segments_cube',
      ]

      for (const view of materializedViews) {
        const result = await refreshMaterializedView(view, database, log)
        if (result) {
          refreshed.push(view)
        }
      }
    } catch (e) {
      log.error({ error: e }, `Error while refreshing materialized views!`)
    }
  },
}

export default job
