import { Sender } from '@questdb/nodejs-client'

import { DEFAULT_TENANT_ID, generateUUIDv4 } from '@crowd/common'
import { getClientILP } from '@crowd/questdb'
import telemetry from '@crowd/telemetry'

import { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'

const ilp: Sender = getClientILP()

export async function insertActivities(
  activities: IDbActivityCreateData[],
  update = false,
): Promise<string[]> {
  const ids: string[] = []
  const now = Date.now()

  if (activities.length > 0) {
    for (const activity of activities) {
      const id = activity.id || generateUUIDv4()
      ids.push(id)

      let createdAt
      if (activity.createdAt) {
        const res = new Date(activity.createdAt)
        // log.info({ createdAt: res }, 'insertActivities.createdAt')
        createdAt = res.getTime()
      } else {
        createdAt = now
      }

      let updatedAt
      if (update || !activity.updatedAt) {
        updatedAt = now
      } else {
        const res = new Date(activity.updatedAt)
        updatedAt = res.getTime()
      }

      const row = ilp
        .table('activities')
        .symbol('tenantId', DEFAULT_TENANT_ID)
        .symbol('segmentId', activity.segmentId)
        .symbol('platform', activity.platform)
        .stringColumn('id', id)
        .timestampColumn('createdAt', createdAt, 'ms')
        .timestampColumn('updatedAt', updatedAt, 'ms')
        .stringColumn('attributes', objectToBytes(tryToUnwrapAttributes(activity.attributes)))
        .booleanColumn('member_isTeamMember', activity.isTeamMemberActivity || false)
        .booleanColumn('member_isBot', activity.isBotActivity || false)

      if (
        activity.platform === 'git' ||
        activity.platform === 'github' ||
        activity.platform === 'gitlab'
      ) {
        if (typeof activity.attributes['isMainBranch'] === 'boolean') {
          row.booleanColumn('gitIsMainBranch', activity.attributes['isMainBranch'] as boolean)
        }

        if (typeof activity.attributes['isIndirectFork'] === 'boolean') {
          row.booleanColumn('gitIsIndirectFork', activity.attributes['isIndirectFork'] as boolean)
        }

        if (typeof activity.attributes['insertions'] === 'number') {
          row.intColumn('gitInsertions', activity.attributes['insertions'] as number)
        } else if (typeof activity.attributes['additions'] === 'number') {
          row.intColumn('gitInsertions', activity.attributes['additions'] as number)
        }

        if (typeof activity.attributes['deletions'] === 'number') {
          row.intColumn('gitDeletions', activity.attributes['deletions'] as number)
        }

        if (typeof activity.attributes['lines'] === 'number') {
          row.intColumn('gitLines', activity.attributes['lines'] as number)
        }

        if (typeof activity.attributes['isMerge'] === 'boolean') {
          row.booleanColumn('gitIsMerge', activity.attributes['isMerge'] as boolean)
        }
      }

      if (activity.type) {
        row.stringColumn('type', activity.type)
      }

      if (typeof activity.isContribution === 'boolean') {
        row.booleanColumn('isContribution', activity.isContribution)
      }

      if (activity.sourceId) {
        row.stringColumn('sourceId', activity.sourceId)
      }

      if (activity.username) {
        row.stringColumn('username', activity.username)
      }

      if (typeof activity.score === 'number') {
        row.intColumn('score', activity.score)
      }

      if (activity.sourceParentId) {
        row.stringColumn('sourceParentId', activity.sourceParentId)
      }

      if (activity.organizationId) {
        row.stringColumn('organizationId', activity.organizationId)
      }

      if (activity.conversationId) {
        row.stringColumn('conversationId', activity.conversationId)
      }

      if (activity.channel) {
        row.stringColumn('channel', activity.channel)
      }

      if (activity.importHash) {
        row.stringColumn('importHash', activity.importHash)
      }

      if (activity.body) {
        row.stringColumn('body', activity.body.slice(0, 2000))
      }

      if (activity.title) {
        row.stringColumn('title', activity.title)
      }

      if (activity.url) {
        row.stringColumn('url', activity.url)
      }

      if (activity.parentId) {
        row.stringColumn('parentId', activity.parentId)
      }

      if (activity.memberId) {
        row.stringColumn('memberId', activity.memberId)
      }

      if (activity.username) {
        row.stringColumn('username', activity.username)
      }

      if (activity.objectMemberId) {
        row.stringColumn('objectMemberId', activity.objectMemberId)
      }

      if (activity.objectMemberUsername) {
        row.stringColumn('objectMemberUsername', activity.objectMemberUsername)
      }

      if (activity.sentiment) {
        if (activity.sentiment.label) {
          row.stringColumn('sentimentLabel', activity.sentiment.label)
        }

        if (typeof activity.sentiment.sentiment === 'number') {
          row.intColumn('sentimentScore', activity.sentiment.sentiment)
        }

        if (typeof activity.sentiment.negative === 'number') {
          row.floatColumn('sentimentScoreNegative', activity.sentiment.negative)
        }

        if (typeof activity.sentiment.mixed === 'number') {
          row.floatColumn('sentimentScoreMixed', activity.sentiment.mixed)
        }

        if (typeof activity.sentiment.positive === 'number') {
          row.floatColumn('sentimentScorePositive', activity.sentiment.positive)
        }

        if (typeof activity.sentiment.neutral === 'number') {
          row.floatColumn('sentimentScoreNeutral', activity.sentiment.neutral)
        }
      }

      if (activity.createdById) {
        row.stringColumn('createdById', activity.createdById)
      }

      if (activity.updatedById) {
        row.stringColumn('updatedById', activity.updatedById)
      }

      let timestamp
      if (activity.timestamp) {
        const res = new Date(activity.timestamp)
        // log.info({ timestamp: res }, 'insertActivities.timestamp')
        timestamp = res.getTime()
      } else {
        timestamp = now
      }

      await row.at(timestamp, 'ms')
      telemetry.increment('questdb.insert_activity', 1)
    }
  }

  return ids
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
