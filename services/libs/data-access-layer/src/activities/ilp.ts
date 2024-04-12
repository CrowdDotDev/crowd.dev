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

    if (activity.platform === 'git' || activity.platform === 'github') {
      row
        .booleanColumn('gitIsMainBranch', activity.attributes['isMainBranch'] as boolean)
        .intColumn('gitInsertions', activity.attributes['additions'] as number)
        .intColumn('gitDeletions', activity.attributes['deletions'] as number)
    }

    row
      .stringColumn('id', id)
      .stringColumn('type', activity.type)
      .booleanColumn('isContribution', activity.isContribution)
      .stringColumn('sourceId', activity.sourceId)
      .timestampColumn('createdAt', now, 'ms')
      .timestampColumn('updatedAt', now, 'ms')
      .stringColumn('attributes', objectToBytes(activity.attributes))
      .stringColumn('username', activity.username)

    if (activity.score) {
      row.intColumn('score', activity.score)
    }

    if (activity.sourceParentId) {
      row.stringColumn('sourceParentId', activity.sourceParentId)
    }

    if (activity.segmentId) {
      row.stringColumn('segmentId', activity.segmentId)
    }

    if (activity.organizationId) {
      row.stringColumn('organizationId', activity.organizationId)
    }

    if (activity.channel) {
      row.stringColumn('channel', activity.channel)
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

    if (activity.objectMemberId) {
      row.stringColumn('objectMemberId', activity.objectMemberId)
    }

    if (activity.objectMemberUsername) {
      row.stringColumn('objectMemberUsername', activity.objectMemberUsername)
    }

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

    row.at(activity.timestamp ? new Date(activity.timestamp).getTime() : now, 'ms')
  }

  await ilp.flush()

  return ids
}

function objectToBytes(input: object): string {
  if (!input) {
    input = {}
  }

  return JSON.stringify(input)
}
