/* eslint-disable @typescript-eslint/no-explicit-any */
import merge from 'lodash.merge'
import moment from 'moment'

import { RawQueryParser, getDefaultTenantId, getEnv } from '@crowd/common'
import { DbConnOrTx } from '@crowd/database'
import { ActivityDisplayService, GithubActivityType } from '@crowd/integrations'
import { getServiceChildLogger } from '@crowd/logging'
import {
  ActivityDisplayVariant,
  IActivityBySentimentMoodResult,
  IActivityByTypeAndPlatformResult,
  IActivityData,
  IEnrichableMemberIdentityActivityAggregate,
  IMemberIdentity,
  ITimeseriesDatapoint,
  MemberIdentityType,
  PageData,
  PlatformType,
} from '@crowd/types'

import { IMemberSegmentAggregates } from '../members/types'
import { IPlatforms } from '../old/apps/cache_worker/types'
import {
  IActivityRelationCreateOrUpdateData,
  IDbActivityCreateData,
  IDbActivityUpdateData,
} from '../old/apps/data_sink_worker/repo/activity.data'
import { IDbOrganizationAggregateData } from '../organizations'
import { QueryExecutor } from '../queryExecutor'
import { checkUpdateRowCount } from '../utils'

import {
  ActivityType,
  IActiveMemberData,
  IActiveOrganizationData,
  IActivitySentiment,
  IMemberSegment,
  INewActivityPlatforms,
  INumberOfActivitiesPerMember,
  INumberOfActivitiesPerOrganization,
  IQueryActiveMembersParameters,
  IQueryActiveOrganizationsParameters,
  IQueryActivitiesParameters,
  IQueryActivityResult,
  IQueryDistinctParameters,
  IQueryGroupedActivitiesParameters,
  IQueryNumberOfActiveMembersParameters,
  IQueryTopActivitiesParameters,
} from './types'

const s3Url = `https://${
  process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
}-${getEnv()}.s3.eu-central-1.amazonaws.com`

export async function getActivitiesById(
  conn: DbConnOrTx,
  ids: string[],
  tenantId: string,
  segmentIds: string[],
): Promise<IQueryActivityResult[]> {
  if (ids.length === 0) {
    return []
  }

  const data = await queryActivities(conn, {
    filter: { and: [{ id: { in: ids } }] },
    limit: ids.length,
    tenantId,
    segmentIds,
  })

  return data.rows
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
  'gitIsIndirectFork',
  'gitInsertions',
  'gitDeletions',
  'gitLines',
  'gitIsMerge',
]

export const ACTIVITY_ALL_COLUMNS: ActivityColumn[] = [
  'id',
  'type',
  'timestamp',
  'platform',
  'isContribution',
  'score',
  'sourceId',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'memberId',
  'parentId',
  'tenantId',
  'createdById',
  'updatedById',
  'sourceParentId',
  'conversationId',
  'attributes',
  'title',
  'body',
  'channel',
  'url',
  'username',
  'objectMemberId',
  'objectMemberUsername',
  'segmentId',
  'organizationId',
  'sentimentLabel',
  'sentimentScore',
  'sentimentScoreMixed',
  'sentimentScoreNeutral',
  'sentimentScoreNegative',
  'sentimentScorePositive',
  'member_isBot',
  'member_isTeamMember',
  'gitIsMainBranch',
  'gitIsIndirectFork',
  'gitLines',
  'gitInsertions',
  'gitDeletions',
  'gitIsMerge',
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
  activity: IDbActivityUpdateData | IDbActivityCreateData,
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
    // need to first query for parent id and then update to set it
    // because questdb doesn't support subqueries in updates
    promises.push(
      conn
        .oneOrNone(
          `
  select id from activities
  where "deletedAt" is null and
        "tenantId" = $(tenantId) and
        "sourceId" = $(sourceParentId) and
        "segmentId" = $(segmentId)
  limit 1
`,
          {
            tenantId: activity.tenantId,
            segmentId: activity.segmentId,
            sourceParentId: activity.sourceParentId,
          },
        )
        .then((res) => {
          if (res) {
            return conn.none(
              `
              update activities set "parentId" = $(parentId)
              where id = $(id) and
                    "tenantId" = $(tenantId) and
                    "segmentId" = $(segmentId) and
                    "deletedAt" is null
            `,
              {
                id,
                tenantId: activity.tenantId,
                segmentId: activity.segmentId,
                parentId: res.id,
              },
            )
          }
        }),
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
  ['type', 'a."type"'],
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
  | 'gitIsIndirectFork'
  | 'gitInsertions'
  | 'gitDeletions'
  | 'gitLines'
  | 'gitIsMerge'

export const DEFAULT_COLUMNS_TO_SELECT: ActivityColumn[] = [
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

export const ALL_COLUMNS_TO_SELECT: ActivityColumn[] = DEFAULT_COLUMNS_TO_SELECT.concat([
  'member_isBot',
  'member_isTeamMember',
  'gitIsMainBranch',
  'gitIsIndirectFork',
  'gitLines',
  'gitInsertions',
  'gitDeletions',
  'gitIsMerge',
])

const logger = getServiceChildLogger('activities')

export async function queryActivities(
  qdbConn: DbConnOrTx,
  arg: IQueryActivitiesParameters,
  columns: ActivityColumn[] = DEFAULT_COLUMNS_TO_SELECT,
): Promise<PageData<IQueryActivityResult | any>> {
  if (arg.tenantId === undefined) {
    // fall back to default tenant
    arg.tenantId = getDefaultTenantId()
  }

  if (arg.tenantId === undefined || arg.segmentIds === undefined || arg.segmentIds.length === 0) {
    throw new Error('tenantId and segmentIds are required to query activities!')
  }

  // set defaultstenant
  arg.filter = arg.filter || {}
  arg.orderBy =
    arg.orderBy && arg.orderBy.length > 0 ? arg.orderBy.filter((o) => o.trim().length > 0) : []
  arg.orderBy = arg.orderBy.length > 0 ? arg.orderBy : ['timestamp_DESC']
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

  // Delete empty arrays filtering conversationId.
  if (arg.filter.and) {
    for (const f of arg.filter.and) {
      if (f.conversationId && f.conversationId.in && f.conversationId.in.length === 0) {
        delete f.conversationId
      }
    }
  }

  const parsedOrderBys = []

  for (const orderByPart of arg.orderBy) {
    const orderByParts = orderByPart.split('_')
    const direction = orderByParts[1].toLowerCase()
    switch (orderByParts[0]) {
      case 'timestamp':
        parsedOrderBys.push({
          property: orderByParts[0],
          column: 'timestamp',
          direction,
        })
        break
      case 'createdAt':
        parsedOrderBys.push({
          property: orderByParts[0],
          column: 'createdAt',
          direction,
        })
        break

      default:
        throw new Error(`Invalid order by: ${orderByPart}!`)
    }
  }

  const orderByString = parsedOrderBys.map((o) => `"${o.column}" ${o.direction}`).join(',')

  const params: any = {
    tenantId: arg.tenantId,
    segmentIds: arg.segmentIds,
    lowerLimit: arg.offset,
    upperLimit: arg.offset + arg.limit,
  }
  let filterString = RawQueryParser.parseFilters(
    arg.filter,
    ACTIVITY_QUERY_FILTER_COLUMN_MAP,
    [],
    params,
    { pgPromiseFormat: true },
  )

  if (filterString.trim().length === 0) {
    filterString = '1=1'
  }

  let baseQuery = `
    from activities a
    where
      ${arg.tenantId ? 'a."tenantId" = $(tenantId) and' : ''}
      ${
        arg.segmentIds && arg.segmentIds.length > 0
          ? 'a."segmentId" in ($(segmentIds:csv)) and'
          : ''
      }
      a."deletedAt" is null and ${filterString}
  `
  if (arg.groupBy) {
    if (arg.groupBy === 'platform') {
      baseQuery += ' SAMPLE BY 1d ALIGN TO CALENDAR'
    }

    baseQuery += ` group by a.${arg.groupBy}`
  }

  const countQuery = `
    select count_distinct(a.id) as count ${baseQuery}
  `

  let activities = []
  let count: number
  if (arg.countOnly) {
    const rows = await qdbConn.query(countQuery, params)
    const countResults = rows[0] ? rows[0].count : 0
    return {
      rows: [],
      count: Number(countResults),
      limit: arg.limit,
      offset: arg.offset,
    }
  } else {
    const columnString = columns
      .map((c) => {
        if (c === 'body') {
          return `left(a."${c}", 512) AS body`
        }

        return `a."${c}"`
      })
      .join(', ')

    let query = `
      select  ${columnString}
      ${baseQuery}
    `

    query += `
      order by ${orderByString}
    `

    if (arg.limit > 0) {
      if (params.lowerLimit) {
        query += ` limit $(lowerLimit), $(upperLimit)`
      } else {
        query += ` limit $(upperLimit)`
      }
    }

    query += ';'

    logger.debug('QuestDB activity query', query)

    const [results, countResults] = await Promise.all([
      qdbConn.any(query, params),
      qdbConn.query(countQuery, params),
    ])

    activities = results
    count = countResults[0] ? countResults[0].count : 0
  }

  const results: any[] = activities.map((a) => mapActivityRowToResult(a, columns))

  return {
    count: Number(count),
    rows: results,
    limit: arg.limit,
    offset: arg.offset,
  }
}

export function mapActivityRowToResult(a: any, columns: string[]): any {
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

  return data
}

export async function findTopActivityTypes(
  qdbConn: DbConnOrTx,
  arg: IQueryTopActivitiesParameters,
): Promise<ActivityType[]> {
  let result: ActivityType[] = []

  const query = `
    SELECT
      a."type", COUNT(id) as count,
      a."platform"
    FROM activities a
    WHERE a."tenantId" = $(tenantId)
    AND a."timestamp" BETWEEN $(after) AND $(before)
    GROUP BY a."type", a.platform
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
    AND "timestamp" BETWEEN $(after) AND $(before)
    ORDER BY "count" DESC;
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
    AND "timestamp" BETWEEN $(after) AND $(before)
    ORDER BY "count" DESC;
  `

  if (arg.limit) {
    query += ' LIMIT $(limit)'
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

export async function getOrgAggregates(
  qdbConn: DbConnOrTx,
  organizationId: string,
): Promise<IDbOrganizationAggregateData[]> {
  const result = await qdbConn.any(
    `
      WITH
        platforms AS (
          SELECT
            DISTINCT
            a."organizationId",
            a."segmentId",
            a.platform
          FROM activities a
          WHERE a."organizationId" = $(organizationId)
        ),
        platforms_agg AS (
          SELECT
            p."organizationId",
            p."segmentId",
            string_distinct_agg(p.platform, ':') AS "activeOn"
          FROM platforms p
        ),
        activites_agg AS (
          SELECT
            a."organizationId",
            a."tenantId",
            a."segmentId",
            count_distinct(a."memberId")      AS "memberCount",
            count_distinct(a.id)              AS "activityCount",
            max(a.timestamp)                  AS "lastActive",
            min(a.timestamp)                  AS "joinedAt",
            coalesce(round(avg(a.score)), 0)  AS "avgContributorEngagement"
          FROM activities a
          WHERE a."organizationId" = $(organizationId)
            AND a."deletedAt" IS NULL
          GROUP BY a."organizationId", a."tenantId", a."segmentId"
        )
      SELECT
        a."organizationId",
        a."tenantId",
        a."segmentId",
        -- <option1>
        MIN(a."memberCount") AS "memberCount",
        MIN(a."activityCount") AS "activityCount",
        MIN(a."lastActive") AS "lastActive",
        MIN(a."joinedAt") AS "joinedAt",
        MIN(a."avgContributorEngagement") AS "avgContributorEngagement",
        string_distinct_agg(p.platform, ':') AS "activeOn"
        -- </option1>

        -- -- <option2>
        -- a.memberCount,
        -- a.activityCount,
        -- a.lastActive,
        -- a.joinedAt,
        -- p.activeOn
        -- -- </option2>
      FROM activites_agg a

      -- <option1>
      JOIN platforms p ON p."organizationId" = a."organizationId" AND p."segmentId" = a."segmentId"
      GROUP BY a."organizationId", a."tenantId", a."segmentId"
      -- </option1>

      -- -- <option2>
      -- JOIN platforms_agg p ON p.organizationId = a.organizationId AND p.segmentId = a.segmentId
      -- -- </option2>
      ;
    `,
    {
      organizationId,
    },
  )

  return result.map((r) => ({
    organizationId,
    segmentId: r.segmentId,
    tenantId: r.tenantId,
    memberCount: parseInt(r.memberCount),
    activityCount: parseInt(r.activityCount),
    activeOn: r.activeOn.split(':'),
    lastActive: r.lastActive,
    joinedAt: r.joinedAt,
    avgContributorEngagement: parseInt(r.avgContributorEngagement),
  }))
}

export async function getMemberAggregates(
  qdbConn: DbConnOrTx,
  memberId: string,
): Promise<IMemberSegmentAggregates[]> {
  const results = await qdbConn.any(
    `
    WITH
      platforms AS (
        SELECT
          DISTINCT
          a."memberId",
          a."segmentId",
          a.platform
        FROM activities a
        WHERE a."memberId" = $(memberId)
      ),
      activity_types AS (
        SELECT
          DISTINCT
          a."memberId",
          a."segmentId",
          a.platform,
          a.type
        FROM activities a
        WHERE a."memberId" = $(memberId)
      ),
      platforms_agg AS (
        SELECT
          p."memberId",
          p."segmentId",
          string_distinct_agg(p.platform, ':') AS "activeOn"
        FROM platforms p
        GROUP BY 1, 2
      ),
      activity_types_agg AS (
        SELECT
          at."memberId",
          at."segmentId",
          string_distinct_agg(concat(at.platform, ':', at.type), '|') as "activityTypes"
        FROM activity_types at
        GROUP BY 1, 2
      ),
      activites_agg AS (
        SELECT
          a."memberId",
          a."tenantId",
          a."segmentId",
          count_distinct(a.id)              AS "activityCount",
          max(a.timestamp)                  AS "lastActive",
          count_distinct(date_trunc('day', a.timestamp))   AS "activeDaysCount",
          avg(a.sentimentScore)             AS "averageSentiment"
        FROM activities a
        WHERE a."memberId" = $(memberId)
          AND a."deletedAt" IS NULL
        GROUP BY a."memberId", a."tenantId", a."segmentId"
      )
    SELECT
      a."memberId",
      a."tenantId",
      a."segmentId",

      a.activityCount,
      a.lastActive,
      a.activeDaysCount,
      a.averageSentiment,
      '' AS "activeOn",
      '' AS "activityTypes"
      -- p.activeOn,
      -- at.activityTypes
    FROM activites_agg a

    -- JOIN platforms_agg p ON p.memberId = a.memberId AND p.segmentId = a.segmentId
    -- JOIN activity_types_agg at ON at.memberId = a.memberId AND at.segmentId = a.segmentId
    ;
    `,
    {
      memberId,
    },
  )

  return results.map((result) => {
    return {
      memberId: result.memberId,
      segmentId: result.segmentId,
      tenantId: result.tenantId,
      // --
      activityCount: parseInt(result.activityCount),
      lastActive: result.lastActive,
      activeDaysCount: result.activeDaysCount,
      averageSentiment: parseFloat(result.averageSentiment),
      activeOn: result.activeOn.split(':'),
      activityTypes: result.activityTypes.split('|'),
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
  arg: IQueryNumberOfActiveMembersParameters,
): Promise<{ count: number; segmentId: string; date?: string }[]> {
  let query = `
    SELECT COUNT(id) AS count, "timestamp" AS date
    FROM activities
    WHERE "deletedAt" IS NULL
    AND "tenantId" = $(tenantId)
    AND "memberId" IS NOT NULL
  `

  if (arg.segmentIds) {
    query += ' AND "segmentId" IN ($(segmentIds:csv))'
  }

  if (arg.organizationId) {
    query += ' AND organizationId = $(organizationId)'
  }

  if (arg.platform) {
    query += ' AND platform = $(platform)'
  }

  if (arg.timestampFrom && arg.timestampTo) {
    query += ' AND timestamp BETWEEN $(after) AND $(before)'
  }

  if (arg.groupBy === 'day') {
    query += ' SAMPLE BY 1d FILL(0) ALIGN TO CALENDAR'
  }

  query += ' ORDER BY "date" ASC;'

  return await qdbConn.any(query, {
    tenantId: arg.tenantId,
    segmentIds: arg.segmentIds,
    organizationId: arg.organizationId,
    after: arg.timestampFrom,
    before: arg.timestampTo,
    platform: arg.platform,
  })
}

export async function activitiesTimeseries(
  qdbConn: DbConnOrTx,
  arg: IQueryGroupedActivitiesParameters,
): Promise<ITimeseriesDatapoint[]> {
  let query = `
    SELECT COUNT_DISTINCT(id) AS count, "timestamp" AS date
    FROM activities
    WHERE "deletedAt" IS NULL
  `

  if (arg.segmentIds) {
    query += ' AND "segmentId" IN ($(segmentIds:csv))'
  }

  if (arg.platform) {
    query += ' AND "platform" = $(platform)'
  }

  if (arg.after && arg.before) {
    query += ' AND "timestamp" BETWEEN $(after) AND $(before)'
  }

  query += `
    SAMPLE BY 1d FILL(0) ALIGN TO CALENDAR
    ORDER BY "date" ASC;
  `

  const rows: ITimeseriesDatapoint[] = await qdbConn.query(query, {
    segmentIds: arg.segmentIds,
    platform: arg.platform,
    after: arg.after,
    before: arg.before,
  })

  rows.forEach((row) => {
    row.count = Number(row.count)
  })

  return rows
}

export async function activitiesBySentiment(
  qdbConn: DbConnOrTx,
  arg: IQueryGroupedActivitiesParameters,
): Promise<IActivityBySentimentMoodResult[]> {
  let query = `
    SELECT COUNT_DISTINCT(id) AS count, sentimentLabel
    FROM activities
    WHERE "deletedAt" IS NULL
    AND "sentimentLabel" IS NOT NULL
  `

  if (arg.segmentIds) {
    query += ' AND "segmentId" IN ($(segmentIds:csv))'
  }

  if (arg.platform) {
    query += ' AND "platform" = $(platform)'
  }

  if (arg.after && arg.before) {
    query += ' AND "timestamp" BETWEEN $(after) AND $(before)'
  }

  query += ` GROUP BY sentimentLabel;`

  const rows: IActivityBySentimentMoodResult[] = await qdbConn.query(query, {
    segmentIds: arg.segmentIds,
    platform: arg.platform,
    after: arg.after,
    before: arg.before,
  })

  rows.forEach((row) => {
    row.count = Number(row.count)
  })

  return rows
}

export async function activitiesByTypeAndPlatform(
  qdbConn: DbConnOrTx,
  arg: IQueryGroupedActivitiesParameters,
): Promise<IActivityByTypeAndPlatformResult[]> {
  let query = `
    SELECT COUNT_DISTINCT(id) AS count, platform, type
    FROM activities
    WHERE "deletedAt" IS NULL
  `

  if (arg.segmentIds) {
    query += ' AND "segmentId" IN ($(segmentIds:csv))'
  }

  if (arg.platform) {
    query += ' AND "platform" = $(platform)'
  }

  if (arg.after && arg.before) {
    query += ' AND "timestamp" BETWEEN $(after) AND $(before)'
  }

  query += ` GROUP BY platform, type ORDER BY count DESC;`

  const rows: IActivityByTypeAndPlatformResult[] = await qdbConn.query(query, {
    segmentIds: arg.segmentIds,
    platform: arg.platform,
    after: arg.after,
    before: arg.before,
  })

  rows.forEach((row) => {
    row.count = Number(row.count)
  })

  return rows
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

export async function getActiveOrganizations(
  qdbConn: DbConnOrTx,
  arg: IQueryActiveOrganizationsParameters,
): Promise<IActiveOrganizationData[]> {
  if (arg.tenantId === undefined || arg.segmentIds === undefined || arg.segmentIds.length === 0) {
    throw new Error('tenantId and segmentIds are required to query active member ids!')
  }

  const params: any = {
    tenantId: arg.tenantId,
    segmentIds: arg.segmentIds,
    tsFrom: arg.timestampFrom,
    tsTo: arg.timestampTo,
    lowerLimit: arg.offset,
    upperLimit: arg.offset + arg.limit - 1,
  }

  const conditions: string[] = [
    'a."tenantId" = $(tenantId)',
    'a."segmentId" in ($(segmentIds:csv))',
    'a."deletedAt" is null',
    'a.timestamp >= $(tsFrom)',
    'a.timestamp <= $(tsTo)',
  ]

  if (arg.platforms && arg.platforms.length > 0) {
    params.platforms = arg.platforms
    conditions.push('a.platform in ($(platforms:csv))')
  }

  let orderByString: string
  if (arg.orderBy === 'activityCount') {
    orderByString = `count_distinct(a.id) ${arg.orderByDirection}`
  } else if (arg.orderBy === 'activeDaysCount') {
    orderByString = `count_distinct(date_trunc('day', a.timestamp)) ${arg.orderByDirection}`
  } else {
    throw new Error(`Invalid order by: ${arg.orderBy}!`)
  }

  const query = `
  select  a."organizationId",
          count_distinct(a.id) as "activityCount",
          count_distinct(date_trunc('day', a.timestamp)) as "activeDaysCount"
  from activities a
  where ${conditions.join(' and ')}
  group by a."organizationId"
  order by ${orderByString}
  limit $(lowerLimit), $(upperLimit);
  `

  const results = await qdbConn.any(query, params)

  return results
}

export async function getActiveMembers(
  qdbConn: DbConnOrTx,
  arg: IQueryActiveMembersParameters,
): Promise<IActiveMemberData[]> {
  if (arg.tenantId === undefined || arg.segmentIds === undefined || arg.segmentIds.length === 0) {
    throw new Error('tenantId and segmentIds are required to query active member ids!')
  }

  const params: any = {
    tenantId: arg.tenantId,
    segmentIds: arg.segmentIds,
    tsFrom: arg.timestampFrom,
    tsTo: arg.timestampTo,
    lowerLimit: arg.offset,
    upperLimit: arg.offset + arg.limit - 1,
  }

  const conditions: string[] = [
    'a."tenantId" = $(tenantId)',
    'a."segmentId" in ($(segmentIds:csv))',
    'a."deletedAt" is null',
    'a.timestamp >= $(tsFrom)',
    'a.timestamp <= $(tsTo)',
  ]

  if (arg.platforms && arg.platforms.length > 0) {
    params.platforms = arg.platforms
    conditions.push('a.platform in ($(platforms:csv))')
  }

  if (arg.isContribution === true) {
    conditions.push('a."isContribution" = true')
  }

  let orderByString: string
  if (arg.orderBy === 'activityCount') {
    orderByString = `count_distinct(a.id) ${arg.orderByDirection}`
  } else if (arg.orderBy === 'activeDaysCount') {
    orderByString = `count_distinct(date_trunc('day', a.timestamp)) ${arg.orderByDirection}`
  } else {
    throw new Error(`Invalid order by: ${arg.orderBy}!`)
  }

  const query = `
  select  a."memberId",
          count_distinct(a.id) as "activityCount",
          count_distinct(date_trunc('day', a.timestamp)) as "activeDaysCount"
  from activities a
  where ${conditions.join(' and ')}
  group by a."memberId"
  order by ${orderByString}
  limit $(lowerLimit), $(upperLimit);
  `

  const results = await qdbConn.any(query, params)

  return results
}

export async function getNewActivityPlatforms(
  qdbConn: DbConnOrTx,
  arg: INewActivityPlatforms,
): Promise<IPlatforms> {
  const query = `
    SELECT DISTINCT(platform) FROM activities
    WHERE "segmentId" IN ($(segmentIds:csv))
    AND "deletedAt" IS NULL
    AND "timestamp" > $(after);
  `

  const rows: { platform: string }[] = await qdbConn.query(query, {
    segmentIds: arg.segmentIds,
    after: arg.after,
  })

  const results: IPlatforms = { platforms: [] }
  rows.forEach((row) => {
    results.platforms.push(row.platform)
  })

  return results
}

export async function getLastActivitiesForMembers(
  qdbConn: DbConnOrTx,
  memberIds: string[],
  tenantId: string,
  segmentIds?: string[],
): Promise<IQueryActivityResult[]> {
  const query = `
  select id from activities where "deletedAt" is null and "memberId" in ($(memberIds:csv))
  latest on timestamp partition by "memberId";
  `
  const results = await qdbConn.any(query, { memberIds })

  if (results.length === 0) {
    return []
  }

  return getActivitiesById(
    qdbConn,
    results.map((r) => r.id),
    tenantId,
    segmentIds,
  )
}

export async function findMemberIdentityWithTheMostActivityInPlatform(
  qdbConn: DbConnOrTx,
  platform: string,
  memberId: string,
): Promise<IEnrichableMemberIdentityActivityAggregate> {
  const query = `
  SELECT count(a.id) AS "activityCount", a.platform, a.username
      FROM activities a
      WHERE a."memberId" = $(memberId)
        AND a.platform = $(platform)
      GROUP BY a.platform, a.username
      ORDER BY "activityCount" DESC
    LIMIT 1;
  `

  return qdbConn.oneOrNone(query, {
    memberId,
    platform,
  })
}

export async function findMatchingPullRequestNodeId(
  qdbConn: DbConnOrTx,
  tenantId: string,
  activity: IActivityData,
): Promise<string | null> {
  if (!activity.attributes.prSha) {
    return null
  }

  const query = `
    SELECT "sourceId"
    FROM activities
    WHERE "deletedAt" IS NULL
      AND "tenantId" = $(tenantId)
      AND "platform" = $(platform)
      AND "type" = $(type)
      AND "timestamp" > $(after)
      AND "timestamp" < $(before)
      AND JSON_EXTRACT(attributes, '$.sha') = $(prSha)
    LIMIT 1;
  `
  const row = await qdbConn.oneOrNone(query, {
    tenantId,
    platform: PlatformType.GITHUB,
    type: GithubActivityType.PULL_REQUEST_OPENED,
    // assuming that the PR is open for at least 6 months
    after: moment(activity.timestamp).subtract(6, 'months').toISOString(),
    before: moment(activity.timestamp).toISOString(),
    prSha: activity.attributes.prSha,
  })

  if (!row) {
    return null
  }

  return row.sourceId
}

export async function findCommitsForPRSha(
  qdbConn: DbConnOrTx,
  tenantId: string,
  prSha: string,
): Promise<string[]> {
  const query = `
    SELECT id
    FROM activities
    WHERE "deletedAt" IS NULL
      AND "tenantId" = $(tenantId)
      AND "platform" = $(platform)
      AND "type" = $(type)
      AND JSON_EXTRACT(attributes, '$.prSha') = $(prSha)
  `

  const rows = await qdbConn.any(query, {
    tenantId,
    platform: PlatformType.GITHUB,
    type: GithubActivityType.PULL_REQUEST_OPENED,
    prSha,
  })

  return rows.map((r) => r.id)
}

export async function createOrUpdateRelations(
  qe: QueryExecutor,
  data: IActivityRelationCreateOrUpdateData,
): Promise<void> {
  await qe.result(
    `
    INSERT INTO "activityRelations" ("activityId", "memberId", "organizationId", "createdAt", "updatedAt")
    VALUES
        ($(activityId), $(memberId), $(organizationId), now(), now())
    ON CONFLICT ("activityId", "memberId", "organizationId") 
    DO UPDATE 
    SET 
        "updatedAt" = EXCLUDED."updatedAt",
        "memberId" = EXCLUDED."memberId",
        "organizationId" = EXCLUDED."organizationId";
    `,
    {
      activityId: data.activityId,
      memberId: data.memberId,
      organizationId: data.organizationId,
    },
  )
}
