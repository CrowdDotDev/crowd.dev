/* eslint-disable @typescript-eslint/no-explicit-any */

import { DbConnOrTx } from '@crowd/database'
import { ActivityDisplayVariant, IActivity, PageData } from '@crowd/types'

import { RawQueryParser, getEnv } from '@crowd/common'
import { IDbActivityUpdateData } from '../old/apps/data_sink_worker/repo/activity.data'
import {
  IActivitySentiment,
  IQueryActivitiesParameters,
  IQueryActivityResult,
  IQueryTopActivitiesParameters,
} from './types'
import { ActivityDisplayService } from '@crowd/integrations'

import merge from 'lodash.merge'

const s3Url = `https://${
  process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
}-${getEnv()}.s3.eu-central-1.amazonaws.com`

export async function getActivityById(conn: DbConnOrTx, id: string): Promise<IActivity> {
  const activity: IActivity = await conn.query(
    `SELECT
      "id",
      "type",
      "platform",
      "timestamp",
      "score",
      "isContribution",
      "sourceId",
      "sourceParentId",
      "attributes",
      "channel",
      "body",
      "title",
      "url",
      "username",
      "member",
      "objectMemberUsername",
      "objectMember"
    FROM activities
    WHERE "id" = $(id)
    AND "deletedAt" IS NULL
    LIMIT 1;
  `,
    {
      id,
    },
  )

  return activity
}

const ACTIVITY_UPDATABLE_COLUMNS: ActivityColumn[] = [
  'type',
  'isContribution',
  'score',
  'sourceId',
  'sourceParentId',
  'memberId',
  'username',
  'objectMemberId',
  'objectMemberUsername',
  'sentimentLabel',
  'sentimentScore',
  'sentimentScoreMixed',
  'sentimentScoreNeutral',
  'sentimentScoreNegative',
  'sentimentScorePositive',
  'member_isBot',
  'member_isTeamMember',
  'gitIsMainBranch',
  'gitInsertions',
  'gitDeletions',
]
export async function updateActivity(
  conn: DbConnOrTx,
  id: string,
  activity: IDbActivityUpdateData,
): Promise<void> {
  if (!activity.tenantId || !activity.segmentId) {
    throw new Error('tenantId and segmentId are required to update an activity!')
  }

  const data: any = {}
  for (const key of ACTIVITY_UPDATABLE_COLUMNS) {
    if (activity[key] !== undefined) {
      data[key] = activity[key]
    }
  }
  // build sentiment data
  if (activity.sentiment) {
    data.sentimentLabel = activity.sentiment.label
    data.sentimentScore = activity.sentiment.sentiment
    data.sentimentScoreNegative = activity.sentiment.negative
    data.sentimentScoreMixed = activity.sentiment.mixed
    data.sentimentScorePositive = activity.sentiment.positive
    data.sentimentScoreNeutral = activity.sentiment.neutral
  }

  // build git data if needed
  if (activity.platform === 'git' || activity.platform === 'github') {
    if (activity.attributes['isMainBranch']) {
      data.gitIsMainBranch = activity.attributes['isMainBranch'] as boolean
    }

    if (activity.attributes['additions']) {
      data.gitInsertions = activity.attributes['additions'] as number
    }

    if (activity.attributes['deletions']) {
      data.gitDeletions = activity.attributes['deletions'] as number
    }
  }

  // no need to update if no columns set
  const keys = Object.keys(data)
  if (keys.length === 0) {
    return
  }

  const params: any = {
    id,
    tenantId: activity.tenantId,
    segmentId: activity.segmentId,
  }

  const sets: string[] = []
  for (const key of keys) {
    sets.push(`"${key}" = $(${key})`)
    params[key] = data[key]
  }

  const query = `
    update activities set
    ${sets.join(', \n')}
    where id = $(id) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId);
  `

  const result = await this.db().result(query)

  this.checkUpdateRowCount(result.rowCount, 1)

  await updateActivityParentIds(conn, id, activity)
}

export async function setMemberDataToActivities(
  conn: DbConnOrTx,
  memberId: string,
  data: { isBot: boolean; isTeamMember: boolean },
): Promise<void> {
  await conn.none(
    `
      update activities set
        "member_isBot" = $(isBot),
        "member_isTeamMember" = $(isTeamMember)
      where "memberId" = $(memberId);
    `,
    {
      memberId,
      ...data,
    },
  )
}

export async function updateActivityParentIds(
  conn: DbConnOrTx,
  id: string,
  activity: IDbActivityUpdateData,
): Promise<void> {
  const promises: Promise<void>[] = [
    conn.none(
      `
      UPDATE activities SET "parentId" = $(id)
      WHERE "tenantId" = $(tenantId)
      AND "sourceParentId" = $(sourceId)
      AND "segmentId" = $(segmentId);
    `,
      {
        id,
        tenantId: activity.tenantId,
        segmentId: activity.segmentId,
        sourceId: activity.sourceId,
      },
    ),
  ]

  if (activity.sourceParentId) {
    promises.push(
      conn.none(
        `
        UPDATE activities SET "parentId" = (
          SELECT "id" FROM activities
          WHERE "tenantId" = $(tenantId)
          AND "sourceId" = $(sourceParentId)
          AND "segmentId" = $(segmentId)
          AND "deletedAt" IS NULL
          LIMIT 1
        )
        WHERE "id" = $(id)
        AND "tenantId" = $(tenantId)
        AND "segmentId" = $(segmentId);
        `,
        {
          id,
          tenantId: activity.tenantId,
          segmentId: activity.segmentId,
          sourceParentId: activity.sourceParentId,
        },
      ),
    )
  }

  await Promise.all(promises)
}

export async function addActivityToConversation(
  conn: DbConnOrTx,
  id: string,
  conversationId: string,
): Promise<void> {
  await conn.none(
    `
    UPDATE activities SET "conversationId" = $(conversationId) WHERE id = $(id);
    `,
    {
      id,
      conversationId,
    },
  )
}

export async function deleteActivities(conn: DbConnOrTx, ids: string[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      return await conn.none('UPDATE activities SET deletedAt = NOW() WHERE id = $(id);', { id })
    }),
  )
}

const ACTIVITY_QUERY_FILTER_COLUMN_MAP: Map<string, string> = new Map([
  ['isTeamMember', 'a."member_isTeamMember"'],
  ['isBot', 'a."member_isBot"'],
  ['platform', 'a.platform'],
  ['type', 'a.type'],
  ['channel', 'a.channel'],
  ['timestamp', 'a.timestamp'],
  ['memberId', 'a."memberId"'],
  ['organizationId', 'a."organizationId"'],
  ['conversationId', 'a."conversationId"'],
  ['sentiment', 'a."sentimentLabel"'],
  ['id', 'a.id'],
  ['sourceId', 'a."sourceId"'],
  ['sourceParentId', 'a."sourceParentId"'],
])

export type ActivityColumn =
  | 'id'
  | 'type'
  | 'timestamp'
  | 'platform'
  | 'isContribution'
  | 'score'
  | 'sourceId'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'memberId'
  | 'parentId'
  | 'tenantId'
  | 'createdById'
  | 'updatedById'
  | 'sourceParentId'
  | 'conversationId'
  | 'attributes'
  | 'title'
  | 'body'
  | 'channel'
  | 'url'
  | 'username'
  | 'objectMemberId'
  | 'objectMemberUsername'
  | 'segmentId'
  | 'organizationId'
  | 'sentimentLabel'
  | 'sentimentScore'
  | 'sentimentScoreMixed'
  | 'sentimentScoreNeutral'
  | 'sentimentScoreNegative'
  | 'sentimentScorePositive'
  | 'member_isBot'
  | 'member_isTeamMember'
  | 'gitIsMainBranch'
  | 'gitInsertions'
  | 'gitDeletions'

const DEFAULT_COLUMNS_TO_SELECT: ActivityColumn[] = [
  'id',
  'attributes',
  'body',
  'channel',
  'conversationId',
  'createdAt',
  'createdById',
  'isContribution',
  'memberId',
  'username',
  'objectMemberId',
  'objectMemberUsername',
  'organizationId',
  'parentId',
  'platform',
  'score',
  'segmentId',
  'sentimentLabel',
  'sentimentScore',
  'sentimentScoreMixed',
  'sentimentScoreNeutral',
  'sentimentScoreNegative',
  'sentimentScorePositive',
  'sourceId',
  'sourceParentId',
  'tenantId',
  'timestamp',
  'title',
  'type',
  'updatedAt',
  'updatedById',
  'url',
]

export async function queryActivities(
  qdbConn: DbConnOrTx, // to query questdb activities
  arg: IQueryActivitiesParameters,
  columns: ActivityColumn[] = DEFAULT_COLUMNS_TO_SELECT,
): Promise<PageData<IQueryActivityResult | any>> {
  if (arg.tenantId === undefined || arg.segmentIds === undefined || arg.segmentIds.length === 0) {
    throw new Error('tenantId and segmentIds are required to query activities!')
  }

  // set defaults
  arg.filter = arg.filter || {}
  arg.orderBy = arg.orderBy || ['timestamp_DESC']
  arg.limit = arg.limit || 20
  arg.offset = arg.offset || 0
  arg.countOnly = arg.countOnly || false

  if (arg.filter.member) {
    if (arg.filter.member.isTeamMember) {
      const condition = {
        isTeamMember: arg.filter.member.isTeamMember,
      }
      if (arg.filter.and) {
        arg.filter.and.push(condition)
      } else {
        arg.filter.and = [condition]
      }
    }

    if (arg.filter.member.isBot) {
      const condition = {
        isBot: arg.filter.member.isBot,
      }

      if (arg.filter.and) {
        arg.filter.and.push(condition)
      } else {
        arg.filter.and = [condition]
      }
    }

    delete arg.filter.member
  }

  const parsedOrderBys = []

  for (const orderByPart of arg.orderBy) {
    const orderByParts = orderByPart.split('_')
    const direction = orderByParts[1].toLowerCase()
    switch (orderByParts[0]) {
      case 'timestamp':
        parsedOrderBys.push({
          property: orderByParts[0],
          column: 'a.timestamp',
          direction,
        })
        break
      case 'createdAt':
        parsedOrderBys.push({
          property: orderByParts[0],
          column: 'a."createdAt"',
          direction,
        })
        break

      default:
        throw new Error(`Invalid order by: ${orderByPart}!`)
    }
  }

  const orderByString = parsedOrderBys.map((o) => `${o.column} ${o.direction}`).join(',')

  const params: any = {
    tenantId: arg.tenantId,
    segmentIds: arg.segmentIds,
    lowerLimit: arg.offset,
    upperLimit: arg.offset + arg.limit - 1,
  }
  let filterString = RawQueryParser.parseFilters(
    arg.filter,
    ACTIVITY_QUERY_FILTER_COLUMN_MAP,
    [],
    params,
    true,
  )

  if (filterString.trim().length === 0) {
    filterString = '1=1'
  }

  const baseQuery = `
    from activities a
    where 
      a."tenantId" = $(tenantId) and
      a."segmentId" in ($(segmentIds:csv)) and
      a."deletedAt" is null and ${filterString}
  `

  const countQuery = `
    select count_distinct(a.id) as count ${baseQuery}
  `

  let activities = []
  let count: number
  if (arg.countOnly) {
    const countResults = (await qdbConn.one(countQuery, params)).count
    return {
      rows: [],
      count: countResults,
      limit: arg.limit,
      offset: arg.offset,
    }
  } else {
    const columnString = columns.map((c) => `a.${c}`).join(', ')
    const query = `
      select  ${columnString}
      ${baseQuery}
      order by ${orderByString}
      limit $(lowerLimit), $(upperLimit);
    `

    const [results, countResults] = await Promise.all([
      qdbConn.any(query, params),
      qdbConn.one(countQuery, params),
    ])

    activities = results
    count = countResults.count
  }

  const results: any[] = []

  for (const a of activities) {
    const sentiment: IActivitySentiment | null =
      a.sentimentLabel &&
      a.sentimentScore &&
      a.sentimentScoreMixed &&
      a.sentimentScoreNeutral &&
      a.sentimentScoreNegative &&
      a.sentimentScorePositive
        ? {
            label: a.sentimentLabel,
            sentiment: a.sentimentScore,
            mixed: a.sentimentScoreMixed,
            neutral: a.sentimentScoreNeutral,
            negative: a.sentimentScoreNegative,
            positive: a.sentimentScorePositive,
          }
        : null

    const data: any = {}
    for (const column of columns) {
      if (column.startsWith('sentiment')) {
        continue
      }

      if (column === 'attributes') {
        data[column] = JSON.parse(a[column])
      } else {
        data[column] = a[column]
      }
    }

    if (sentiment) {
      data.sentiment = sentiment
    }

    results.push(data)
  }

  return {
    count,
    rows: results,
    limit: arg.limit,
    offset: arg.offset,
  }
}

export interface ActivityType {
  count: number
  type: string
  platform: string
  percentage: string
  platformIcon: string
}

export async function findTopActivityTypes(
  qdbConn: DbConnOrTx,
  arg: IQueryTopActivitiesParameters,
): Promise<ActivityType[]> {
  let result: ActivityType[] = []

  const query = `
    SELECT
      a.type, COUNT(id) as count,
      a.platform
    FROM activities a
    WHERE a."tenantId" = $(tenantId)
    AND a.timestamp BETWEEN $(after) AND $(before)
    GROUP BY a.type, a.platform
    ORDER BY COUNT(*) DESC
    LIMIT $(limit);
  `

  result = await qdbConn.query(query, {
    tenantId: arg.tenantId,
    after: arg.after,
    before: arg.before,
    limit: arg.limit || 10,
  })

  const totalCount = result.map((row) => {
    return totalCount + row.count
  })

  result = result.map((a) => {
    const displayOptions = ActivityDisplayService.getDisplayOptions(
      {
        platform: a.platform,
        type: a.type,
      },
      arg.segments.reduce((acc, s) => merge(acc, s.customActivityTypes), {}),
      [ActivityDisplayVariant.SHORT],
    )
    const prettyName: string = displayOptions.short
    a.type = prettyName[0].toUpperCase() + prettyName.slice(1)
    a.percentage = Number((a.count / totalCount) * 100).toFixed(2)
    a.platformIcon = `${s3Url}/email/${a.platform}.png`
    return a
  })

  return result
}
