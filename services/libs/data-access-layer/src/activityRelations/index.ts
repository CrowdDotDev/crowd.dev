import { RawQueryParser } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { PageData } from '@crowd/types'

import { IMemberSegmentCoreAggregates } from '../members/types'
import { IOrganizationActivityCoreAggregates } from '../organizations/types'
import { QueryExecutor } from '../queryExecutor'

import { IActivityRelationColumn, IDbActivityRelation } from './types'

export interface IQueryActivityRelationsParameters {
  segmentIds?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: any
  orderBy?: string[]
  limit?: number
  offset?: number
  countOnly?: boolean
  noCount?: boolean
  groupBy?: string
}

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
  'isContribution',
  'pullRequestReviewState',
]

const logger = getServiceChildLogger('activityRelations')

export async function queryActivityRelations(
  qx: QueryExecutor,
  arg: IQueryActivityRelationsParameters,
  columns: IActivityRelationColumn[] = ALL_ACTIVITY_RELATION_COLUMNS,
): Promise<PageData<Partial<IDbActivityRelation>>> {
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

  const params = {
    segmentIds: arg.segmentIds,
    limit: arg.limit,
    offset: arg.offset,
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

  const query = `
    select ${columnString}
    ${baseQuery}
    order by ${orderByString}
    limit $(limit) offset $(offset)
  `

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
    const result = await qe.result(
      `
          UPDATE "activityRelations"
          SET "memberId" = $(toId)
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

    rowsUpdated = result.length
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
    const result = await qe.result(
      `
          UPDATE "activityRelations"
          SET "memberId" = $(toId)
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

    rowsUpdated = result.length
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
    const result = await qe.result(
      `
          UPDATE "activityRelations"
          SET "organizationId" = $(toId)
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

    rowsUpdated = result.length
  } while (rowsUpdated === batchSize)
}
