import { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'
import QueryStream from 'pg-query-stream'
import { formatQuery } from '../queryExecutor'
import { insertActivities } from './ilp'
import { getServiceChildLogger, timer } from '@crowd/logging'
import { DbConnOrTx } from '@crowd/database'

const logger = getServiceChildLogger('activities.update')

export async function updateActivities(
  qdb: DbConnOrTx,
  mapActivity: (activity: IDbActivityCreateData) => Promise<Partial<IDbActivityCreateData>>,
  where: string,
  params?: Record<string, string>,
): Promise<{ processed: number; duration: number }> {
  const whereClause = formatQuery(where, params)
  const qs = new QueryStream(
    `
      SELECT *
      FROM activities
      WHERE ${whereClause}
    `,
  )

  const t = timer(logger, `query activities with ${whereClause}`)
  const res = await qdb.stream(qs, async (stream) => {
    for await (const item of stream) {
      t.end()

      const activity = item as unknown as IDbActivityCreateData

      await insertActivities([
        {
          ...activity,
          ...(await mapActivity(activity)),
        },
      ])
    }
  })
  return res
}
