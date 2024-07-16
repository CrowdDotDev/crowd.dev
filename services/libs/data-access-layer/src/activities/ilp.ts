import { generateUUIDv4 } from '@crowd/common'
import { getClientILP } from '@crowd/questdb'

import { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'

import { Sender } from '@questdb/nodejs-client'

const ilp: Sender = getClientILP()

export async function insertActivities(activities: IDbActivityCreateData[]): Promise<string[]> {
  const ids: string[] = []
  const now = Date.now()

  for (const activity of activities) {
    const id = activity.id || generateUUIDv4()
    ids.push(id)

    const row = ilp
      .table('activities')
      .symbol('tenantId', activity.tenantId)
      .symbol('segmentId', activity.segmentId)
      .symbol('platform', activity.platform)
      .stringColumn('id', id)
      .timestampColumn('createdAt', now, 'ms')
      .timestampColumn('updatedAt', now, 'ms')
      .stringColumn('attributes', objectToBytes(activity.attributes))
      .booleanColumn('member_isTeamMember', activity.isTeamMemberActivity || false)
      .booleanColumn('member_isBot', activity.isBotActivity || false)

    if (activity.platform === 'git' || activity.platform === 'github') {
      if (activity.attributes['isMainBranch']) {
        row.booleanColumn('gitIsMainBranch', activity.attributes['isMainBranch'] as boolean)
      }

      if (activity.attributes['isIndirectFork']) {
        row.booleanColumn('gitIsIndirectFork', activity.attributes['isIndirectFork'] as boolean)
      }

      if (activity.attributes['additions']) {
        row.intColumn('gitInsertions', activity.attributes['additions'] as number)
      }

      if (activity.attributes['deletions']) {
        row.intColumn('gitDeletions', activity.attributes['deletions'] as number)
      }
    }

    if (activity.type) {
      row.stringColumn('type', activity.type)
    }

    if (activity.isContribution) {
      row.booleanColumn('isContribution', activity.isContribution)
    }

    if (activity.sourceId) {
      row.stringColumn('sourceId', activity.sourceId)
    }

    if (activity.username) {
      row.stringColumn('username', activity.username)
    }

    if (activity.score) {
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
      row.stringColumn('body', activity.body)
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

      if (activity.sentiment.sentiment) {
        row.intColumn('sentimentScore', activity.sentiment.sentiment)
      }

      if (activity.sentiment.negative) {
        row.floatColumn('sentimentScoreNegative', activity.sentiment.negative)
      }

      if (activity.sentiment.mixed) {
        row.floatColumn('sentimentScoreMixed', activity.sentiment.mixed)
      }

      if (activity.sentiment.positive) {
        row.floatColumn('sentimentScorePositive', activity.sentiment.positive)
      }

      if (activity.sentiment.neutral) {
        row.floatColumn('sentimentScoreNeutral', activity.sentiment.neutral)
      }
    }

    if (activity.createdById) {
      row.stringColumn('createdById', activity.createdById)
    }

    if (activity.updatedById) {
      row.stringColumn('updatedById', activity.updatedById)
    }

    await row.at(activity.timestamp ? new Date(activity.timestamp).getTime() : now, 'ms')
  }

  try {
    await ilp.flush()
  } catch (err) {
    throw err
  }

  return ids
}

function objectToBytes(input: object): string {
  if (!input) {
    input = {}
  }

  return JSON.stringify(input)
}
