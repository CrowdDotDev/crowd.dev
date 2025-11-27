import { RawQueryParser } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { IEnrichableMemberIdentityActivityAggregate, PageData } from '@crowd/types'

import { IMemberSegmentCoreAggregates, IMemberSegmentDisplayAggregates } from '../members/types'
import {
  IOrganizationActivityCoreAggregates,
  IOrganizationDisplayAggregates,
} from '../organizations/types'
import { QueryExecutor } from '../queryExecutor'

import {
  IActiveMemberData,
  IActiveOrganizationData,
  IActivityRelationColumn,
  IDbActivityRelation,
  IQueryActiveMembersParameters,
  IQueryActiveOrganizationsParameters,
  IQueryActivityRelationsParameters,
} from './types'

const ALL_ACTIVITY_RELATION_COLUMNS: IActivityRelationColumn[] = [
  'activityId',
  'memberId',
  'objectMemberId',
  'organizationId',
  'conversationId',
  'parentId',
  'segmentId',
  'platform',
  'username',
  'objectMemberUsername',
  'sourceId',
  'sourceParentId',
  'type',
  'timestamp',
  'channel',
  'sentimentScore',
  'gitInsertions',
  'gitDeletions',
  'score',
  'pullRequestReviewState',
]

const logger = getServiceChildLogger('activityRelations')

export async function queryActivityRelations(
  qx: QueryExecutor,
  arg: IQueryActivityRelationsParameters,
  columns: IActivityRelationColumn[] = ALL_ACTIVITY_RELATION_COLUMNS,
): Promise<PageData<IDbActivityRelation>> {
  // Set defaults
  arg.filter = arg.filter || {}
  arg.orderBy =
    arg.orderBy && arg.orderBy.length > 0 ? arg.orderBy.filter((o) => o.trim().length > 0) : []
  arg.orderBy = arg.orderBy.length > 0 ? arg.orderBy : ['timestamp_DESC']
  arg.offset = arg.offset || 0
  arg.limit = arg.limit || 20
  arg.countOnly = arg.countOnly || false

  // Clean up empty conversationId arrays
  if (arg.filter.and) {
    for (const f of arg.filter.and) {
      if (f.conversationId && f.conversationId.in && f.conversationId.in.length === 0) {
        delete f.conversationId
      }
    }
  }

  // Parse orderBy entries
  const parsedOrderBys = arg.orderBy.map((orderByPart) => {
    const [column, dir] = orderByPart.split('_')
    const direction = dir?.toLowerCase()

    if (!columns.includes(column as IActivityRelationColumn)) {
      throw new Error(`Cannot order by column '${column}' that is not selected`)
    }

    if (!['asc', 'desc'].includes(direction)) {
      throw new Error(`Invalid sort direction: ${direction} for column: ${column}`)
    }

    return { column, direction }
  })

  const orderByString = parsedOrderBys.map((o) => `ar."${o.column}" ${o.direction}`).join(', ')

  const params: Record<string, unknown> = {
    segmentIds: arg.segmentIds,
  }

  const ACTIVITY_RELATIONS_QUERY_FILTER_COLUMN_MAP = new Map(
    ALL_ACTIVITY_RELATION_COLUMNS.map((col) => [col, `ar."${col}"`]),
  )

  let whereClause = RawQueryParser.parseFilters(
    arg.filter,
    ACTIVITY_RELATIONS_QUERY_FILTER_COLUMN_MAP,
    [],
    params,
    { pgPromiseFormat: true },
  )

  if (whereClause.trim().length === 0) {
    whereClause = '1=1'
  }

  if (arg.segmentIds && arg.segmentIds.length > 0) {
    whereClause += ` and ar."segmentId" in ($(segmentIds:csv))`
  } else {
    logger.warn('No segmentIds filter provided, querying all segments!')
  }

  let baseQuery = `
    from "activityRelations" ar
    where ${whereClause}
  `

  if (arg.groupBy) {
    baseQuery += ` group by ar."${arg.groupBy}"`
  }

  const countQuery = `
    select count(*) as count ${baseQuery}
  `

  if (arg.countOnly) {
    const countResults = await qx.select(countQuery, params)

    return {
      rows: [],
      count: Number(countResults[0]?.count || 0),
      limit: arg.limit,
      offset: arg.offset,
    }
  }

  const columnString = columns.map((c) => `ar."${c}"`).join(', ')

  let query = `
    select ${columnString}
    ${baseQuery}
    order by ${orderByString}
  `

  if (!arg.noLimit || arg.limit > 0) {
    query += ` limit $(limit) offset $(offset)`

    params.limit = arg.limit
    params.offset = arg.offset
  }

  // Execute both queries in parallel
  const [results, countResults] = await Promise.all([
    qx.select(query, params),
    arg.noCount ? Promise.resolve([{ count: 0 }]) : qx.select(countQuery, params),
  ])

  return {
    rows: results,
    count: Number(countResults[0]?.count || 0),
    limit: arg.limit,
    offset: arg.offset,
  }
}

export async function getMemberActivityCoreAggregates(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberSegmentCoreAggregates[]> {
  const results = await qx.select(
    `
    SELECT "segmentId",
       array_agg(DISTINCT platform) AS "activeOn",
       COUNT("activityId") AS "activityCount"
    FROM "activityRelations"
    WHERE "memberId" = $(memberId)
    GROUP BY "segmentId";
      `,
    { memberId },
  )

  return results.map((result) => ({
    memberId,
    segmentId: result.segmentId,
    activeOn: result.activeOn || [],
    activityCount: parseInt(result.activityCount),
  }))
}

export async function getOrganizationActivityCoreAggregates(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IOrganizationActivityCoreAggregates[]> {
  const results = await qx.select(
    `
    SELECT "segmentId",
          array_agg(DISTINCT platform) AS "activeOn",
          COUNT("activityId") AS "activityCount",
          COUNT(DISTINCT "memberId")   AS "memberCount"
    FROM "activityRelations"
    WHERE "organizationId" = $(organizationId)
    GROUP BY "segmentId";
    `,
    { organizationId },
  )

  return results.map((result) => ({
    organizationId,
    segmentId: result.segmentId,
    activeOn: result.activeOn || [],
    activityCount: parseInt(result.activityCount),
    memberCount: parseInt(result.memberCount),
  }))
}

export async function moveActivityRelationsToAnotherMember(
  qe: QueryExecutor,
  fromId: string,
  toId: string,
  batchSize = 5000,
) {
  let rowsUpdated

  do {
    const rowCount = await qe.result(
      `
          UPDATE "activityRelations"
          SET
            "memberId" = $(toId),
            "updatedAt" = now()
          WHERE "activityId" in (
            select "activityId" from "activityRelations"
            where "memberId" = $(fromId)
            limit $(batchSize)
          )
          returning "activityId"
        `,
      {
        toId,
        fromId,
        batchSize,
      },
    )

    rowsUpdated = rowCount
  } while (rowsUpdated === batchSize)
}

export async function moveActivityRelationsWithIdentityToAnotherMember(
  qe: QueryExecutor,
  fromId: string,
  toId: string,
  username: string,
  platform: string,
  batchSize = 5000,
) {
  let rowsUpdated

  do {
    const rowCount = await qe.result(
      `
          UPDATE "activityRelations"
          SET
            "memberId" = $(toId),
            "updatedAt" = now()
          WHERE "activityId" in (
            select "activityId" from "activityRelations"
            where 
              "memberId" = $(fromId) and
              "username" = $(username) and
              "platform" = $(platform)
            limit $(batchSize)
          )
          returning "activityId"
        `,
      {
        toId,
        fromId,
        username,
        platform,
        batchSize,
      },
    )

    rowsUpdated = rowCount
  } while (rowsUpdated === batchSize)
}

export async function moveActivityRelationsToAnotherOrganization(
  qe: QueryExecutor,
  fromId: string,
  toId: string,
  batchSize = 5000,
) {
  let rowsUpdated

  do {
    const rowCount = await qe.result(
      `
          UPDATE "activityRelations"
          SET
            "organizationId" = $(toId),
            "updatedAt" = now()
          WHERE "activityId" in (
            select "activityId" from "activityRelations"
            where "organizationId" = $(fromId)
            limit $(batchSize)
          )
          returning "activityId"
        `,
      {
        toId,
        fromId,
        batchSize,
      },
    )

    rowsUpdated = rowCount
  } while (rowsUpdated === batchSize)
}

export async function findMemberIdentityWithTheMostActivityInPlatform(
  qx: QueryExecutor,
  memberId: string,
  platform: string,
): Promise<IEnrichableMemberIdentityActivityAggregate> {
  return await qx.selectOneOrNone(
    `
    SELECT count(a.id) AS "activityCount", a.platform, a.username
      FROM "activityRelations" a
      WHERE a."memberId" = $(memberId)
        AND a.platform = $(platform)
      GROUP BY a.platform, a.username
      ORDER BY "activityCount" DESC
    LIMIT 1;
    `,
    { memberId, platform },
  )
}

export async function filterMembersWithActivityRelations(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<string[]> {
  const results = await qx.select(
    `select distinct "memberId" from "activityRelations" where "memberId" in ($(memberIds:csv))`,
    { memberIds },
  )

  return results.map((r) => r.memberId)
}

export async function getActiveMembers(
  qx: QueryExecutor,
  arg: IQueryActiveMembersParameters,
): Promise<IActiveMemberData[]> {
  if (arg.segmentIds === undefined || arg.segmentIds.length === 0) {
    throw new Error('segmentIds is required to query active member ids!')
  }

  const params: Record<string, unknown> = {
    segmentIds: arg.segmentIds,
    tsFrom: arg.timestampFrom,
    tsTo: arg.timestampTo,
    limit: arg.limit,
    offset: arg.offset,
  }

  const conditions: string[] = [
    `ar."segmentId" in ($(segmentIds:csv))`,
    `ar.timestamp >= $(tsFrom)`,
    `ar.timestamp <= $(tsTo)`,
  ]

  if (arg.platforms && arg.platforms.length > 0) {
    params.platforms = arg.platforms
    conditions.push(`ar.platform in ($(platforms:csv))`)
  }

  let orderByString: string
  if (arg.orderBy === 'activityCount') {
    orderByString = `"activityCount" ${arg.orderByDirection}`
  } else if (arg.orderBy === 'activeDaysCount') {
    orderByString = `"activeDaysCount" ${arg.orderByDirection}`
  } else {
    throw new Error(`Invalid order by: ${arg.orderBy}!`)
  }

  const query = `
  select  ar."memberId" as "memberId",
          count(distinct ar."activityId") as "activityCount",
          count(distinct date_trunc('day', ar.timestamp)) as "activeDaysCount"
  from "activityRelations" ar
  where ${conditions.join(' and ')}
  group by ar."memberId"
  order by ${orderByString}
  limit $(limit) offset $(offset);
  `

  return qx.select(query, params)
}

export async function getActiveOrganizations(
  qx: QueryExecutor,
  arg: IQueryActiveOrganizationsParameters,
): Promise<IActiveOrganizationData[]> {
  if (arg.segmentIds === undefined || arg.segmentIds.length === 0) {
    throw new Error('segmentIds is required to query active organizations!')
  }

  const params: Record<string, unknown> = {
    segmentIds: arg.segmentIds,
    tsFrom: arg.timestampFrom,
    tsTo: arg.timestampTo,
    limit: arg.limit,
    offset: arg.offset,
  }

  const conditions: string[] = [
    `ar."segmentId" in ($(segmentIds:csv))`,
    `ar.timestamp >= $(tsFrom)`,
    `ar.timestamp <= $(tsTo)`,
    `ar."organizationId" is not null`,
  ]

  if (arg.platforms && arg.platforms.length > 0) {
    params.platforms = arg.platforms
    conditions.push(`ar.platform in ($(platforms:csv))`)
  }

  let orderByString: string
  if (arg.orderBy === 'activityCount') {
    orderByString = `"activityCount" ${arg.orderByDirection}`
  } else if (arg.orderBy === 'activeDaysCount') {
    orderByString = `"activeDaysCount" ${arg.orderByDirection}`
  } else {
    throw new Error(`Invalid order by: ${arg.orderBy}!`)
  }

  const query = `
  select  ar."organizationId",
          count(distinct ar."activityId") as "activityCount",
          count(distinct date_trunc('day', ar.timestamp)) as "activeDaysCount"
  from "activityRelations" ar
  where ${conditions.join(' and ')}
  group by ar."organizationId"
  order by ${orderByString}
  limit $(limit) offset $(offset);
  `

  return qx.select(query, params)
}

export async function getLatestMemberActivityRelations(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<{ activityId: string; timestamp: string }[]> {
  return qx.select(
    `
    select distinct on ("memberId") "activityId", timestamp
    from "activityRelations"
    where "memberId" in ($(memberIds:csv))
    order by "memberId", "timestamp" desc;
  `,
    { memberIds },
  )
}

export async function fetchMemberDisplayAggregates(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberSegmentDisplayAggregates[]> {
  const results = await qx.select(
    `
    SELECT
      "segmentId",
      max(timestamp) AS "lastActive",
      COALESCE(avg("sentimentScore"), 0.0) AS "averageSentiment",
      COALESCE(string_agg(DISTINCT (platform || ':' || type), '|'), '') AS "activityTypes"
    FROM "activityRelations"
    WHERE "memberId" = $(memberId)
    GROUP BY "segmentId"
    `,
    { memberId },
  )

  return results.map((result) => {
    return {
      memberId,
      segmentId: result.segmentId,

      lastActive: result.lastActive || null,
      averageSentiment: parseFloat(result.averageSentiment),
      activityTypes: result.activityTypes ? result.activityTypes.split('|') : [],
    }
  })
}

export async function fetchOrganizationDisplayAggregates(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IOrganizationDisplayAggregates[]> {
  const results = await qx.select(
    `
    SELECT
        "segmentId",
        max(timestamp) AS "lastActive",
        min(timestamp) AS "joinedAt",
        coalesce(round(avg(score))::integer, 0) AS "avgContributorEngagement"
    FROM "activityRelations"
    WHERE "organizationId" = $(organizationId)
    GROUP BY "segmentId"
    `,
    { organizationId },
  )

  return results.map((result) => {
    return {
      organizationId,
      segmentId: result.segmentId,
      joinedAt: result.joinedAt,
      lastActive: result.lastActive,
      avgContributorEngagement: result.avgContributorEngagement,
    }
  })
}

export interface IActivityRelationDuplicateGroup {
  activityIds: string[]
  timestamp: string
  platform: string
  type: string
  sourceId: string
  channel: string
  segmentId: string
}

export async function fetchActivityRelationsDuplicateGroups(
  qx: QueryExecutor,
  limit: number,
  cursor?: Omit<IActivityRelationDuplicateGroup, 'activityIds'>,
): Promise<IActivityRelationDuplicateGroup[]> {
  return qx.select(
    `
    WITH grouped_activity_relations AS (
      SELECT
        "timestamp", "platform", "type", "sourceId", "channel", "segmentId",
        array_agg("activityId" ORDER BY "updatedAt" DESC) AS "activityIds"
      FROM "activityRelations"
      WHERE
        "timestamp" IS NOT NULL AND "platform" IS NOT NULL AND 
        "type" IS NOT NULL AND "sourceId" IS NOT NULL AND 
        "channel" IS NOT NULL AND "segmentId" IS NOT NULL
        ${
          cursor
            ? `AND ("timestamp", "platform", "type", "sourceId", "channel", "segmentId") >
                 ($(timestamp), $(platform), $(type), $(sourceId), $(channel), $(segmentId))`
            : ''
        }
      GROUP BY
        "timestamp", "platform", "type", "sourceId", "channel", "segmentId"
      HAVING COUNT(*) > 1
      ORDER BY "timestamp", "platform", "type", "sourceId", "channel", "segmentId"
    )
    SELECT * FROM grouped_activity_relations LIMIT $(limit);
    `,
    { limit, ...(cursor || {}) },
  )
}

export async function deleteActivityRelationsById(
  qx: QueryExecutor,
  activityIds: string[],
): Promise<void> {
  await qx.result(
    `
    DELETE FROM "activityRelations" WHERE "activityId" IN ($(activityIds:csv));
    `,
    { activityIds },
  )
}
