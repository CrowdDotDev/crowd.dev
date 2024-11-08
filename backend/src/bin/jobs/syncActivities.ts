import cronGenerator from 'cron-time-generator'

import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { IDbActivityCreateData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.repo'
import { QueryExecutor, formatQuery, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { Logger, logExecutionTimeV2, timer } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'
import { PlatformType } from '@crowd/types'

import { DB_CONFIG } from '@/conf'

import { CrowdJob } from '../../types/jobTypes'

async function decideUpdatedAt(pgQx: QueryExecutor, maxUpdatedAt?: string): Promise<string> {
  if (!maxUpdatedAt) {
    const result = await pgQx.selectOne('SELECT MAX("updatedAt") AS "maxUpdatedAt" FROM activities')
    return result?.maxUpdatedAt
  }

  return maxUpdatedAt
}

async function getTotalActivities(qdbQx: QueryExecutor, whereClause: string): Promise<number> {
  const { totalActivities } = await qdbQx.selectOne(
    `SELECT COUNT(1) AS "totalActivities" FROM activities WHERE ${whereClause}`,
  )
  return totalActivities
}

function createWhereClause(updatedAt: string): string {
  return formatQuery('"updatedAt" > $(updatedAt)', { updatedAt })
}

async function syncActivitiesBatch(
  activityRepo: ActivityRepository,
  activities: IDbActivityCreateData[],
) {
  const result = {
    inserted: 0,
    updated: 0,
  }

  for (const activity of activities) {
    const existingActivity = await activityRepo.existsWithId(activity.id)

    if (existingActivity) {
      await activityRepo.rawUpdate(activity.id, {
        ...activity,
        platform: activity.platform as PlatformType,
      })
      result.updated++
    } else {
      await activityRepo.rawInsert(activity)
      result.inserted++
    }
  }

  return result
}

export async function syncActivities(logger: Logger, maxUpdatedAt?: string) {
  logger.info(`Syncing activities from ${maxUpdatedAt}`)

  const qdb = await getClientSQL()
  const db = await getDbConnection({
    host: DB_CONFIG.writeHost,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.username,
    password: DB_CONFIG.password,
  })

  const pgQx = pgpQx(db)
  const qdbQx = pgpQx(qdb)
  const activityRepo = new ActivityRepository(new DbStore(logger, db, undefined, true), logger)

  let updatedAt = await logExecutionTimeV2(
    () => decideUpdatedAt(pgQx, maxUpdatedAt),
    logger,
    'decide updatedAt',
  )

  const whereClause = createWhereClause(updatedAt)

  const totalActivities = await logExecutionTimeV2(
    () => getTotalActivities(qdbQx, whereClause),
    logger,
    'get total activities',
  )

  let counter = 0

  const t = timer(logger, `sync ${totalActivities} activities`)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await logExecutionTimeV2(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      () =>
        qdbQx.select(
          `
            SELECT *
            FROM activities
            WHERE "updatedAt" > $(updatedAt)
            ORDER BY "updatedAt"
            LIMIT 1000;
          `,
          { updatedAt },
        ),
      logger,
      `getting activities with updatedAt > ${updatedAt}`,
    )

    if (result.length === 0) {
      break
    }

    const t = timer(logger)
    const { inserted, updated } = await syncActivitiesBatch(activityRepo, result)
    t.end(`Inserting ${inserted} and updating ${updated} activities`)

    counter += inserted + updated
    const pct = Math.round((counter / totalActivities) * 100)
    logger.info(`synced ${counter} activities out of ${totalActivities}. That's ${pct}%`)

    updatedAt = result[result.length - 1].updatedAt
  }

  t.end()
}

const job: CrowdJob = {
  name: 'Sync Activities',
  // every day
  cronTime: cronGenerator.every(1).days(),
  onTrigger: async (logger: Logger) => {
    await syncActivities(logger)
  },
}

export default job
