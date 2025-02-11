import QueryStream from 'pg-query-stream'

import { DbConnOrTx } from '@crowd/database'
import { getServiceChildLogger, timer } from '@crowd/logging'
import { IQueue } from '@crowd/queue'

import { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'
import { formatQuery } from '../queryExecutor'

import { insertActivities } from './ilp'

const logger = getServiceChildLogger('activities.update')

export async function streamActivities(
  qdb: DbConnOrTx,
  onActivity: (activity: IDbActivityCreateData) => Promise<void>,
  where: string,
  params?: Record<string, unknown>,
): Promise<{ processed: number; duration: number }> {
  const whereClause = formatQuery(where, params)
  const qs = new QueryStream(`SELECT * FROM activities WHERE ${whereClause}`)

  const t = timer(logger, `query activities with ${whereClause}`)

  return new Promise((resolve, reject) => {
    let processedAllRows = false
    let streamResult = null

    function tryFinish() {
      if (processedAllRows && streamResult) {
        resolve(streamResult)
      }
    }

    qdb
      .stream(qs, async (stream) => {
        for await (const item of stream) {
          t.end()

          const activity = item as unknown as IDbActivityCreateData

          await onActivity(activity)
        }

        processedAllRows = true
        tryFinish()
      })
      .then((res) => {
        streamResult = res
        tryFinish()
      })
      .catch(reject)
  })
}

export type MapActivityFunction = (
  activity: IDbActivityCreateData,
) => Promise<Partial<IDbActivityCreateData>>

export async function updateActivities(
  qdb: DbConnOrTx,
  queueClient: IQueue,
  mapActivity: MapActivityFunction | MapActivityFunction[],
  where: string,
  params?: Record<string, unknown>,
): Promise<{ processed: number; duration: number }> {
  async function mapNewActivity(
    activity: IDbActivityCreateData,
    mapActivity: MapActivityFunction | MapActivityFunction[],
  ): Promise<IDbActivityCreateData> {
    let newActivity = activity

    if (!Array.isArray(mapActivity)) {
      mapActivity = [mapActivity]
    }

    for (const map of mapActivity) {
      newActivity = {
        ...newActivity,
        ...(await map(newActivity)),
      }
    }

    return newActivity
  }

  return streamActivities(
    qdb,
    async (activity) => {
      const newActivity = await mapNewActivity(activity, mapActivity)
      await insertActivities(queueClient, [newActivity], true)
    },
    where,
    params,
  )
}
