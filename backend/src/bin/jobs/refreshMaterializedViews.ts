import { QueryTypes } from 'sequelize'
import { Logger, getChildLogger, getServiceChildLogger, logExecutionTimeV2 } from '@crowd/logging'
import { CrowdJob } from '../../types/jobTypes'
import { databaseInit } from '@/database/databaseConnection'

export const refreshMaterializedView = async (
  view: string,
  database: any,
  log: Logger,
): Promise<boolean> => {
  log = getChildLogger('execution', log, {
    view,
  })
  try {
    const refreshQuery = `refresh materialized view concurrently "${view}"`
    const runningQuery = await database.sequelize.query(
      `
        select 1
        from pg_stat_activity
        where query = :refreshQuery
          and state != 'idle'
          and pid != pg_backend_pid()
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
        `Materialized view will not be refreshed because there's already an ongoing refresh for it!`,
      )
      return false
    }

    log.info('Refreshing materialized view')
    await logExecutionTimeV2(
      () =>
        database.sequelize.query(refreshQuery, {
          useMaster: true,
        }),
      log,
      `Refresh Materialized View ${view}`,
    )

    return true
  } catch (err) {
    log.error({ error: err }, 'Error while refreshing materialized view!')
    return false
  }
}

const job: CrowdJob = {
  name: 'Refresh Materialized View',
  cronTime: process.env.CROWD_MV_OTHERS_REFRESH_PERIOD,
  onTrigger: async () => {
    const database = await databaseInit(1000 * 60 * 15, true)
    const log = getServiceChildLogger('RefreshMVJob')

    if (process.env.CROWD_REFRESH_MEMBER_ACTIVITY_AGGREGATES_MV) {
      await refreshMaterializedView('memberActivityAggregatesMVs', database, log)
    }
    await refreshMaterializedView('member_segments_mv', database, log)
  },
}

export default job
