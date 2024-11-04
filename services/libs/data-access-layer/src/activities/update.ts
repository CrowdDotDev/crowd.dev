import QueryStream from 'pg-query-stream'

import { DbConnOrTx } from '@crowd/database'
import { getServiceChildLogger, timer } from '@crowd/logging'

import { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'
import { formatQuery } from '../queryExecutor'

import { insertActivities } from './ilp'

const logger = getServiceChildLogger('activities.update')

export async function streamActivities(
  qdb: DbConnOrTx,
  onActivity: (activity: IDbActivityCreateData) => Promise<void>,
  where: string,
  params?: Record<string, string>,
): Promise<{ processed: number; duration: number }> {
  const whereClause = formatQuery(where, params)
  const qs = new QueryStream(`SELECT * FROM activities WHERE ${whereClause}`)

  const t = timer(logger, `query activities with ${whereClause}`)
  const res = await qdb.stream(qs, async (stream) => {
    for await (const item of stream) {
      t.end()

      const activity = item as unknown as IDbActivityCreateData

      await onActivity(activity)
    }
  })
  return res
}

export async function updateActivities(
  qdb: DbConnOrTx,
  mapActivity: (activity: IDbActivityCreateData) => Promise<Partial<IDbActivityCreateData>>,
  where: string,
  params?: Record<string, string>,
): Promise<{ processed: number; duration: number }> {
  return streamActivities(
    qdb,
    async (activity) => {
      await insertActivities([
        {
          ...activity,
          ...(await mapActivity(activity)),
        },
      ])
    },
    where,
    params,
  )
}
