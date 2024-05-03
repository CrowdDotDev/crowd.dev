/* eslint-disable @typescript-eslint/no-explicit-any */

import { DbConnOrTx } from '@crowd/database'
import {
  ActivityDisplayVariant,
  IActivity,
  IMemberIdentity,
  IMemberSegmentAggregates,
  MemberIdentityType,
  PageData,
} from '@crowd/types'

import { RawQueryParser, getEnv } from '@crowd/common'
import { IDbActivityUpdateData } from '../old/apps/data_sink_worker/repo/activity.data'
import {
  ActivityType,
  IActivitySentiment,
  IMemberSegment,
  INumberOfActivitiesPerMember,
  INumberOfActivitiesPerOrganization,
  IOrganizationSegment,
  IOrganizationSegmentAggregates,
  IQueryActivitiesParameters,
  IQueryActivityResult,
  IQueryDistinctParameters,
  IQueryTopActivitiesParameters,
} from './types'
import { ActivityDisplayService } from '@crowd/integrations'

import merge from 'lodash.merge'
import { checkUpdateRowCount } from '../utils'

const s3Url = `https://${
  process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
}-${getEnv()}.s3.eu-central-1.amazonaws.com`

export async function getActivitiesById(conn: DbConnOrTx, ids: string[]): Promise<IActivity[]> {
  const activities = await conn.any(
    `SELECT
      "id",
      "type",
      "platform",
      "timestamp",
      "score",
      "isContribution",
      "sourceId",
      "parentId",
      "sourceParentId",
      "conversationId",
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
    WHERE "id" in ($(ids:csv))
    AND "deletedAt" IS NULL
  `,
    {
      ids,
    },
  )

  return activities
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
    throw new Error('tenantId and segmentId are required to update activity!')
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

  if (activity.updatedById) {
    sets.push('"updatedById" = $(updatedById)')
    params.updatedById = activity.updatedById
  }

  const query = `
    update activities set
    ${sets.join(', \n')}
    where id = $(id) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId);
  `

  const result = await conn.result(query, params)

  checkUpdateRowCount(result.rowCount, 1)

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
  if (!(arg.noLimit === true)) {
    arg.limit = arg.limit || 20
  }
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

  let totalCount = 0
  result.forEach((row) => {
    totalCount += Number(row.count)
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

export async function getMostActiveOrganizations(
  qdbConn: DbConnOrTx,
  arg: IQueryDistinctParameters,
): Promise<INumberOfActivitiesPerOrganization[]> {
  let query = `
    SELECT DISTINCT organizationId, COUNT() AS count
    FROM activities
    WHERE tenantId = $(tenantId)
    AND organizationId IS NOT NULL
    AND timestamp BETWEEN $(after) AND $(before)
    ORDER BY count DESC;
  `

  if (arg.limit) {
    query += ` LIMIT $(limit)`
  }

  query += ';'

  const result: INumberOfActivitiesPerOrganization[] = await qdbConn.query(query, {
    tenantId: arg.tenantId,
    after: arg.after,
    before: arg.before,
    limit: arg.limit || 20,
  })

  return result
}

export async function getMostActiveMembers(
  qdbConn: DbConnOrTx,
  arg: IQueryDistinctParameters,
): Promise<INumberOfActivitiesPerMember[]> {
  let query = `
    SELECT DISTINCT memberId, COUNT() AS count
    FROM activities
    WHERE tenantId = $(tenantId)
    AND memberId IS NOT NULL
    AND timestamp BETWEEN $(after) AND $(before)
    ORDER BY count DESC;
  `

  if (arg.limit) {
    query += ` LIMIT $(limit)`
  }

  query += ';'

  const result: INumberOfActivitiesPerMember[] = await qdbConn.query(query, {
    tenantId: arg.tenantId,
    after: arg.after,
    before: arg.before,
    limit: arg.limit,
  })

  return result
}

export async function getOrganizationAggregates(
  qdbConn: DbConnOrTx,
  organizationId: string,
  segmentId: string,
): Promise<IOrganizationSegmentAggregates> {
  const result = await qdbConn.oneOrNone(
    `
    with relevant_activities as (select id, timestamp, platform, "memberId", "organizationId", "segmentId"
                                from activities
                                where "organizationId" = $(organizationId)
                                  and "segmentId" = $(segmentId)
                                  and "deletedAt" is null),
        distinct_platforms as (select distinct "organizationId", "segmentId", platform from relevant_activities),
        distinct_members as (select distinct "organizationId", "segmentId", "memberId" from relevant_activities),
        joined_at_timestamp as (select "organizationId", "segmentId", min(timestamp) as "joinedAt"
                                from relevant_activities
                                where timestamp <> '1970-01-01T00:00:00.000Z')
    select a."organizationId",
          a."segmentId",
          count_distinct(a."memberId")  as "memberCount",
          count_distinct(a.id)          as "activityCount",
          max(a.timestamp)              as "lastActive",
          string_agg(p.platform, ':')   as "activeOn",
          string_agg(m."memberId", ':') as "memberIds",
          t."joinedAt"
    from relevant_activities a
            inner join distinct_platforms p on a."organizationId" = p."organizationId" and a."segmentId" = p."segmentId"
            inner join distinct_members m on a."organizationId" = m."organizationId" and a."segmentId" = m."segmentId"
            left join joined_at_timestamp t on a."organizationId" = t."organizationId" and a."segmentId" = t."segmentId"
    group by a."organizationId", a."segmentId", t."joinedAt";
    `,
    {
      organizationId,
      segmentId,
    },
  )

  if (result) {
    return {
      organizationId,
      segmentId,
      memberIds: result.memberIds.split(':'),
      memberCount: result.memberCount,
      activityCount: result.activityCount,
      activeOn: result.activeOn.split(':'),
      lastActive: result.lastActive,
      joinedAt: result.joinedAt,
    }
  } else {
    return {
      organizationId,
      segmentId,
      memberIds: [],
      memberCount: 0,
      activityCount: 0,
      activeOn: [],
      lastActive: null,
      joinedAt: null,
    }
  }
}

export async function getMemberAggregates(
  qdbConn: DbConnOrTx,
  memberId: string,
  segmentIds: string[],
): Promise<IMemberSegmentAggregates[]> {
  const results = await qdbConn.any(
    `
    with relevant_activities as (select id, platform, type, timestamp, "sentimentScore", "memberId", "segmentId"
                                from activities
                                where "memberId" = $(memberId)
                                  and "segmentId" in ($(segmentId:csv))
                                  and "deletedAt" is null),
        activity_types as (select distinct "memberId", "segmentId", type, platform
                            from relevant_activities
                            where platform is not null
                              and type is not null),
        distinct_platforms as (select distinct "memberId", "segmentId", platform from relevant_activities),
        average_sentiment as (select "memberId", "segmentId", avg("sentimentScore") as "averageSentiment"
                              from relevant_activities
                              where "sentimentScore" is not null)
    select a."memberId",
          a."segmentId",
          count(a.id)                                      as "activityCount",
          max(a.timestamp)                                 as "lastActive",
          string_agg(p.platform, ':')                      as "activeOn",
          string_agg(concat(t.platform, ':', t.type), '|') as "activityTypes",
          count_distinct(date_trunc('day', now()))         as "activeDaysCount",
          s."averageSentiment"
    from relevant_activities a
            inner join activity_types t on a."memberId" = t."memberId" and a."segmentId" = t."segmentId"
            inner join distinct_platforms p on a."memberId" = p."memberId" and a."segmentId" = p."segmentId"
            left join average_sentiment s on a."memberId" = s."memberId" and a."segmentId" = s."segmentId"
    group by a."memberId", a."segmentId", s."averageSentiment";
    `,
    {
      memberId,
      segmentIds,
    },
  )

  return results.map((result) => {
    return {
      memberId: result.memberId,
      segmentId: result.segmentId,
      activityCount: result.activityCount,
      lastActive: result.lastActive,
      activeOn: result.activeOn.split(':'),
      activityTypes: result.activityTypes.split('|'),
      activeDaysCount: result.activeDaysCount,
      averageSentiment: result.averageSentiment,
    }
  })
}

export async function getActivityCountOfMemberIdentities(
  qdbConn: DbConnOrTx,
  memberId: string,
  identities: IMemberIdentity[],
): Promise<number> {
  if (identities.length === 0) {
    throw new Error(`No identities sent!`)
  }

  let query = `
  select count(id) from activities
  where "deletedAt" is null and "memberId" = $(memberId)  
  `

  const replacementKey = (key: string, index: number) => `${key}${index}`

  const conditions: string[] = []

  const params = {
    memberId,
  }

  for (
    let i = 0;
    i < identities.filter((i) => i.type === MemberIdentityType.USERNAME).length;
    i++
  ) {
    const platformKey = replacementKey('platform', i)
    const usernameKey = replacementKey('username', i)

    conditions.push(`(platform = $(${platformKey}) and username = $(${usernameKey}))`)

    params[platformKey] = identities[i].platform
    params[usernameKey] = identities[i].value
  }

  if (conditions.length > 0) {
    query = `${query} and (${conditions.join(' or ')})`
  }

  return await qdbConn.one(query, params, (a) => a.count)
}

export async function countMembersWithActivities(
  qdbConn: DbConnOrTx,
  segmentIds: string[],
): Promise<{ count: number; segmentId: string }[]> {
  return await qdbConn.any(
    `
      select count(id) as count, "segmentId" from activities 
      where "deletedAt" is null and "segmentId" in ($(segmentIds:csv))
      group by "segmentId"
    `,
    {
      segmentIds,
    },
  )
}

export async function filterMembersWithActivities(
  qdbConn: DbConnOrTx,
  memberIds: string[],
): Promise<string[]> {
  const results = await qdbConn.any(
    `
    select distinct "memberId" from activities where "deletedAt" is null and "memberId" in ($(memberIds:csv))
    `,
    {
      memberIds,
    },
  )

  return results.map((r) => r.memberId)
}

export async function getMemberSegmentCouples(
  qdbConn: DbConnOrTx,
  memberIds: string[],
): Promise<IMemberSegment[]> {
  return qdbConn.any(
    `
    select distinct "memberId", "segmentId" 
    from activities 
    where "deletedAt" is null and "memberId" in ($(memberIds:csv));
    `,
    {
      memberIds,
    },
  )
}

export async function getOrganizationSegmentCouples(
  qdbConn: DbConnOrTx,
  organizationIds: string[],
): Promise<IOrganizationSegment[]> {
  return qdbConn.any(
    `
    select distinct "organizationId", "segmentId" 
    from activities 
    where "deletedAt" is null and "organizationId" in ($(organizationIds:csv));
    `,
    {
      organizationIds,
    },
  )
}
