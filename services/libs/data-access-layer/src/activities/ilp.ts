import { pick } from 'lodash'
import moment from 'moment'

import { DEFAULT_TENANT_ID, generateUUIDv4 } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { ACTIVITIES_QUEUE_SETTINGS, IQueue, QueueEmitter } from '@crowd/queue'
import telemetry from '@crowd/telemetry'

import { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'

import { ACTIVITY_ALL_COLUMNS } from './sql'

const logger = getServiceChildLogger('insert-activities')

export async function insertActivities(
  queueClient: IQueue,
  activities: IDbActivityCreateData[],
): Promise<string[]> {
  const now = moment().toISOString()

  const toInsert = activities
    .map((activity) => {
      const id = activity.id || generateUUIDv4()

      return {
        // we keep these ones in front of `...activity` because these fields might exist in the activity object
        member_isBot: activity.isBotActivity || false,
        member_isTeamMember: activity.isTeamMemberActivity || false,
        gitIsMainBranch: activity.attributes['isMainBranch'],
        gitIsIndirectFork: activity.attributes['isIndirectFork'],
        gitInsertions: activity.attributes['insertions'] || activity.attributes['additions'],
        gitDeletions: activity.attributes['deletions'],
        gitLines: activity.attributes['lines'],
        gitIsMerge: activity.attributes['isMerge'],

        ...activity,

        id,
        updatedAt: now,
        createdAt: activity.createdAt ? moment(activity.createdAt).toISOString() : now,
        timestamp: activity.timestamp ? moment(activity.timestamp).toISOString() : now,
        attributes: objectToBytes(tryToUnwrapAttributes(activity.attributes)),
        body: activity.body?.slice(0, 2000),
      }
    })
    .map((activity) => {
      return {
        ...pick(activity, ACTIVITY_ALL_COLUMNS),
        tenantId: DEFAULT_TENANT_ID,
      }
    }) // otherwise QuestDB insert fails

  const emitter = new QueueEmitter(queueClient, ACTIVITIES_QUEUE_SETTINGS, logger)

  for (const row of toInsert) {
    logger.debug(
      {
        activityId: row.id,
        queue: ACTIVITIES_QUEUE_SETTINGS.name,
      },
      'Dispatching activity to queue!',
    )
    await emitter.sendMessage(generateUUIDv4(), row, generateUUIDv4())
  }
  telemetry.increment('questdb.insert_activity', activities.length)

  return toInsert.map((activity) => activity.id)
}

function objectToBytes(input: object): string {
  if (typeof input !== 'object') {
    return input
  }

  if (!input) {
    input = {}
  }

  const stringified = JSON.stringify(input)

  // check size
  if (new TextEncoder().encode(stringified).length > 2000) {
    return JSON.stringify({})
  }

  return JSON.stringify(input)
}

function tryToUnwrapAttributes(attributes: string | object): object {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (typeof attributes === 'object') {
      return attributes
    }
    attributes = JSON.parse(attributes)
  }
}
