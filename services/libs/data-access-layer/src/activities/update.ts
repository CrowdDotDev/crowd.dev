import QueryStream from 'pg-query-stream'

import { DbConnOrTx } from '@crowd/database'
import { getServiceChildLogger, timer } from '@crowd/logging'
import { IQueue } from '@crowd/queue'

import { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'
import { QueryExecutor, formatQuery } from '../queryExecutor'

import { insertActivities } from './ilp'
import { updateActivityRelationsById } from './sql'

const logger = getServiceChildLogger('activities.update')

export async function streamActivities(
  qdb: DbConnOrTx,
  onActivity: (activity: IDbActivityCreateData) => Promise<void>,
  where: string,
  params?: Record<string, unknown>,
): Promise<{ processed: number; duration: number }> {
  const whereClause = formatQuery(where, params)
  const qs = new QueryStream(`SELECT * FROM activities WHERE ${whereClause}`, [], {
    batchSize: 1000,
    highWaterMark: 250,
  })

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
        try {
          for await (const item of stream) {
            t.end()

            const activity = item as unknown as IDbActivityCreateData
            await onActivity(activity)
          }

          processedAllRows = true
          tryFinish()
        } catch (error) {
          reject(error)
        }
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
  pgQx: QueryExecutor,
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
      await insertActivities(queueClient, [newActivity])
      const changedRelations = getChangedRelationshipFields(activity, newActivity)
      if (Object.keys(changedRelations).length > 0) {
        await updateActivityRelationsById(pgQx, {
          ...changedRelations,
          activityId: activity.id,
        })
      }
    },
    where,
    params,
  )
}

function getChangedRelationshipFields(
  activity: IDbActivityCreateData,
  newActivity: IDbActivityCreateData,
): Partial<IDbActivityCreateData> {
  const updatedData = {}
  const relationships = [
    'memberId',
    'objectMemberId',
    'organizationId',
    'conversationId',
    'parentId',
    'segmentId',
    'platform',
    'username',
    'objectMemberUsername',
  ]

  for (const relationship of relationships) {
    if (activity[relationship] !== newActivity[relationship]) {
      updatedData[relationship] = newActivity[relationship]
    }
  }

  return updatedData
}
