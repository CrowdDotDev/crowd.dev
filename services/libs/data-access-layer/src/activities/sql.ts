/* eslint-disable @typescript-eslint/no-explicit-any */
import max from 'lodash.max'
import min from 'lodash.min'

import { DbConnOrTx } from '@crowd/database'
import { ITimeseriesDatapoint } from '@crowd/types'

import { getLatestMemberActivityRelations, queryActivityRelations } from '../activityRelations'
import { IPlatforms } from '../old/apps/cache_worker/types'
import {
  IActivityRelationCreateOrUpdateData,
  IActivityRelationUpdateById,
} from '../old/apps/data_sink_worker/repo/activity.data'
import { QueryExecutor, connQx } from '../queryExecutor'

import {
  IActivitySentiment,
  INewActivityPlatforms,
  IQueryActivityResult,
  IQueryGroupedActivitiesParameters,
} from './types'

// const s3Url = `https://${
//   process.env['CROWD_S3_MICROSERVICES_ASSETS_BUCKET']
// }-${getEnv()}.s3.eu-central-1.amazonaws.com`

export async function getActivitiesById(
  conn: DbConnOrTx,
  ids: string[],
  segmentIds: string[],
): Promise<IQueryActivityResult[]> {
  if (ids.length === 0) {
    return []
  }

  const data = await queryActivityRelations(connQx(conn), {
    filter: { and: [{ activityId: { in: ids } }] },
    limit: ids.length,
    segmentIds,
  })

  return data.rows
}

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

// const ACTIVITY_QUERY_FILTER_COLUMN_MAP: Map<string, string> = new Map([
//   ['isTeamMember', 'a."member_isTeamMember"'],
//   ['isBot', 'a."member_isBot"'],
//   ['platform', 'a.platform'],
//   ['type', 'a."type"'],
//   ['channel', 'a.channel'],
//   ['timestamp', 'a.timestamp'],
//   ['memberId', 'a."memberId"'],
//   ['organizationId', 'a."organizationId"'],
//   ['conversationId', 'a."conversationId"'],
//   ['sentiment', 'a."sentimentLabel"'],
//   ['id', 'a.id'],
//   ['sourceId', 'a."sourceId"'],
//   ['sourceParentId', 'a."sourceParentId"'],
// ])

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

// TODO questdb to tinybird
// const logger = getServiceChildLogger('activities')

// export async function queryActivities(
//   qdbConn: DbConnOrTx,
//   arg: IQueryActivitiesParameters,
//   columns: ActivityColumn[] = DEFAULT_COLUMNS_TO_SELECT,
// ): Promise<PageData<IQueryActivityResult | any>> {
//   if (arg.segmentIds === undefined || arg.segmentIds.length === 0) {
//     throw new Error('segmentIds are required to query activities!')
//   }

//   arg.filter = arg.filter || {}
//   arg.orderBy =
//     arg.orderBy && arg.orderBy.length > 0 ? arg.orderBy.filter((o) => o.trim().length > 0) : []
//   arg.orderBy = arg.orderBy.length > 0 ? arg.orderBy : ['timestamp_DESC']
//   if (!(arg.noLimit === true)) {
//     arg.limit = arg.limit || 20
//   }
//   arg.offset = arg.offset || 0
//   arg.countOnly = arg.countOnly || false

//   if (arg.filter.member) {
//     if (arg.filter.member.isTeamMember) {
//       const condition = {
//         isTeamMember: arg.filter.member.isTeamMember,
//       }
//       if (arg.filter.and) {
//         arg.filter.and.push(condition)
//       } else {
//         arg.filter.and = [condition]
//       }
//     }

//     if (arg.filter.member.isBot) {
//       const condition = {
//         isBot: arg.filter.member.isBot,
//       }

//       if (arg.filter.and) {
//         arg.filter.and.push(condition)
//       } else {
//         arg.filter.and = [condition]
//       }
//     }

//     delete arg.filter.member
//   }

//   // Delete empty arrays filtering conversationId.
//   if (arg.filter.and) {
//     for (const f of arg.filter.and) {
//       if (f.conversationId && f.conversationId.in && f.conversationId.in.length === 0) {
//         delete f.conversationId
//       }
//     }
//   }

//   const parsedOrderBys = []

//   for (const orderByPart of arg.orderBy) {
//     const orderByParts = orderByPart.split('_')
//     const direction = orderByParts[1].toLowerCase()
//     switch (orderByParts[0]) {
//       case 'timestamp':
//         parsedOrderBys.push({
//           property: orderByParts[0],
//           column: 'timestamp',
//           direction,
//         })
//         break
//       case 'createdAt':
//         parsedOrderBys.push({
//           property: orderByParts[0],
//           column: 'createdAt',
//           direction,
//         })
//         break

//       default:
//         throw new Error(`Invalid order by: ${orderByPart}!`)
//     }
//   }

//   const orderByString = parsedOrderBys.map((o) => `"${o.column}" ${o.direction}`).join(',')

//   const params: any = {
//     segmentIds: arg.segmentIds,
//     lowerLimit: arg.offset,
//     upperLimit: arg.offset + arg.limit,
//   }
//   let filterString = RawQueryParser.parseFilters(
//     arg.filter,
//     ACTIVITY_QUERY_FILTER_COLUMN_MAP,
//     [],
//     params,
//     { pgPromiseFormat: true },
//   )

//   if (filterString.trim().length === 0) {
//     filterString = '1=1'
//   }

//   let baseQuery = `
//     from activities a
//     where
//       ${
//         arg.segmentIds && arg.segmentIds.length > 0
//           ? 'a."segmentId" in ($(segmentIds:csv)) and'
//           : ''
//       }
//       a."deletedAt" is null and ${filterString}
//   `
//   if (arg.groupBy) {
//     if (arg.groupBy === 'platform') {
//       baseQuery += ' SAMPLE BY 1d ALIGN TO CALENDAR'
//     }

//     baseQuery += ` group by a.${arg.groupBy}`
//   }

//   const countQuery = `
//     select count_distinct(a.id) as count ${baseQuery}
//   `

//   let activities = []
//   let count: number
//   if (arg.countOnly) {
//     const rows = await qdbConn.query(countQuery, params)
//     const countResults = rows[0] ? rows[0].count : 0
//     return {
//       rows: [],
//       count: Number(countResults),
//       limit: arg.limit,
//       offset: arg.offset,
//     }
//   } else {
//     const columnString = columns
//       .map((c) => {
//         if (c === 'body') {
//           return `left(a."${c}", 512) AS body`
//         }

//         return `a."${c}"`
//       })
//       .join(', ')

//     let query = `
//       select  ${columnString}
//       ${baseQuery}
//     `

//     query += `
//       order by ${orderByString}
//     `

//     if (arg.limit > 0) {
//       if (params.lowerLimit) {
//         query += ` limit $(lowerLimit), $(upperLimit)`
//       } else {
//         query += ` limit $(upperLimit)`
//       }
//     }

//     query += ';'

//     logger.debug('QuestDB activity query', query)

//     const formattedQuery = formatQuery(query, params)
//     const formattedCountQuery = formatQuery(countQuery, params)

//     const [results, countResults] = await Promise.all([
//       qdbConn.any(formattedQuery),
//       arg.noCount === true ? Promise.resolve([{ count: 0 }]) : qdbConn.query(formattedCountQuery),
//     ])

//     activities = results
//     count = countResults[0] ? countResults[0].count : 0
//   }

//   const results: any[] = activities.map((a) => mapActivityRowToResult(a, columns))

//   return {
//     count: Number(count),
//     rows: results,
//     limit: arg.limit,
//     offset: arg.offset,
//   }
// }

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

// TODO questdb to tinybird
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
  qx: QueryExecutor,
  memberIds: string[],
  segmentIds?: string[],
): Promise<IQueryActivityResult[]> {
  const results = await getLatestMemberActivityRelations(qx, memberIds)

  if (results.length === 0) {
    return []
  }

  const activityIds = results.map((r) => r.activityId)
  const timestamps = results.map((r) => r.timestamp)

  const activities = await queryActivityRelations(qx, {
    filter: {
      and: [
        {
          id: {
            in: activityIds,
          },
        },
        {
          segmentId: {
            in: segmentIds || [],
          },
        },
        {
          timestamp:
            activityIds.length > 1
              ? {
                  gte: min(timestamps),
                  lte: max(timestamps),
                }
              : { eq: timestamps[0] },
        },
      ],
    },
  })

  return activities.rows
}

// TODO questdb to tinybird
// export async function findMatchingPullRequestNodeId(
//   qdbConn: DbConnOrTx,
//   activity: IActivityData,
// ): Promise<string | null> {
//   if (!activity.attributes.prSha) {
//     return null
//   }

//   const query = `
//     SELECT "sourceId"
//     FROM activities
//     WHERE "deletedAt" IS NULL
//       AND "platform" = $(platform)
//       AND "type" = $(type)
//       AND "timestamp" > $(after)
//       AND "timestamp" < $(before)
//       AND JSON_EXTRACT(attributes, '$.sha') = $(prSha)
//     LIMIT 1;
//   `
//   const row = await qdbConn.oneOrNone(query, {
//     platform: PlatformType.GITHUB,
//     type: GithubActivityType.PULL_REQUEST_OPENED,
//     // assuming that the PR is open for at least 6 months
//     after: moment(activity.timestamp).subtract(6, 'months').toISOString(),
//     before: moment(activity.timestamp).toISOString(),
//     prSha: activity.attributes.prSha,
//   })

//   if (!row) {
//     return null
//   }

//   return row.sourceId
// }

export async function createOrUpdateRelations(
  qe: QueryExecutor,
  relations: IActivityRelationCreateOrUpdateData[],
  skipChecks = false,
): Promise<void> {
  if (relations.length === 0) {
    return
  }

  const params: Record<string, unknown> = {}
  let index = 0

  const activityIds = new Set<string>()
  const valueList: string[] = []
  for (const data of relations) {
    if (data.username === undefined || data.username === null) {
      continue
    }

    if (data.platform === undefined || data.platform === null) {
      continue
    }

    if (data.segmentId === undefined || data.segmentId === null) {
      continue
    }

    if (!skipChecks) {
      // check objectMember exists
      if (data.objectMemberId !== undefined && data.objectMemberId !== null) {
        let objectMember = await qe.select(
          `
      SELECT id
      FROM members
      WHERE id = $(objectMemberId)
    `,
          {
            objectMemberId: data.objectMemberId,
          },
        )

        if (objectMember.length === 0) {
          if (data.objectMemberUsername && data.platform) {
            objectMember = await qe.select(
              `
          SELECT "memberId"
          FROM "memberIdentities"
          WHERE value = $(value) and platform = $(platform) and verified = true
          limit 1
        `,
              {
                value: data.objectMemberUsername,
                platform: data.platform,
              },
            )

            if (objectMember.length === 0) {
              data.objectMemberId = null
            } else {
              data.objectMemberId = objectMember[0].memberId
            }
          } else {
            data.objectMemberId = null
          }
        }
      }

      // check conversation exists
      if (data.conversationId !== undefined && data.conversationId !== null) {
        const conversation = await qe.select(
          `
      SELECT id
      FROM conversations
      WHERE id = $(conversationId)
    `,
          {
            conversationId: data.conversationId,
          },
        )

        if (conversation.length === 0) {
          data.conversationId = null
        }
      }

      // check segmentId exists
      const segment = await qe.select(
        `
      SELECT id
      FROM segments
      WHERE id = $(segmentId)
    `,
        {
          segmentId: data.segmentId,
        },
      )

      if (segment.length === 0) {
        // segment not found, skip adding this activity relation
        continue
      }

      // check member exists
      let member = await qe.select(
        `
      SELECT id
      FROM members
      WHERE id = $(memberId)
    `,
        {
          memberId: data.memberId,
        },
      )

      if (member.length === 0) {
        // find member using identity
        member = await qe.select(
          `
        SELECT "memberId"
        FROM "memberIdentities"
        WHERE value = $(value) and platform = $(platform) and verified = true
        limit 1
      `,
          {
            value: data.username,
            platform: data.platform,
          },
        )
        if (member.length === 0) {
          // member not found, skip adding this activity relation
          continue
        } else {
          data.memberId = member[0].memberId
        }
      }

      if (data.organizationId !== undefined && data.organizationId !== null) {
        const organization = await qe.select(
          `
        SELECT id
        FROM organizations
        WHERE id = $(organizationId)
      `,
          {
            organizationId: data.organizationId,
          },
        )

        if (organization.length === 0) {
          data.organizationId = null
        }
      }
    }

    if (activityIds.has(data.activityId)) {
      continue
    }

    activityIds.add(data.activityId)

    const activityIdParam = `activityId_${index++}`
    const memberIdParam = `memberId_${index++}`
    const objectMemberIdParam = `objectMemberId_${index++}`
    const organizationIdParam = `organizationId_${index++}`
    const conversationIdParam = `conversationId_${index++}`
    const parentIdParam = `parentId_${index++}`
    const segmentIdParam = `segmentId_${index++}`
    const platformParam = `platform_${index++}`
    const usernameParam = `username_${index++}`
    const objectMemberUsernameParam = `objectMemberUsername_${index++}`
    const sourceIdParam = `sourceId_${index++}`
    const sourceParentIdParam = `sourceParentId_${index++}`
    const typeParam = `type_${index++}`
    const timestampParam = `timestamp_${index++}`
    const channelParam = `channel_${index++}`
    const sentimentScoreParam = `sentimentScore_${index++}`
    const gitInsertionsParam = `gitInsertions_${index++}`
    const gitDeletionsParam = `gitDeletions_${index++}`
    const scoreParam = `score_${index++}`
    const isContributionParam = `isContribution_${index++}`
    const pullRequestReviewStateParam = `pullRequestReviewState_${index++}`

    params[activityIdParam] = data.activityId
    params[memberIdParam] = data.memberId
    params[objectMemberIdParam] = data.objectMemberId ?? null
    params[organizationIdParam] = data.organizationId ?? null
    params[conversationIdParam] = data.conversationId ?? null
    params[parentIdParam] = data.parentId ?? null
    params[segmentIdParam] = data.segmentId
    params[platformParam] = data.platform
    params[usernameParam] = data.username
    params[objectMemberUsernameParam] = data.objectMemberUsername ?? null
    params[sourceIdParam] = data.sourceId ?? null
    params[sourceParentIdParam] = data.sourceParentId ?? null
    params[typeParam] = data.type ?? null
    params[timestampParam] = data.timestamp ?? null
    params[channelParam] = data.channel ?? null
    params[sentimentScoreParam] = data.sentimentScore ?? null
    params[gitInsertionsParam] = data.gitInsertions ?? null
    params[gitDeletionsParam] = data.gitDeletions ?? null
    params[scoreParam] = data.score ?? null
    params[isContributionParam] = data.isContribution ?? null
    params[pullRequestReviewStateParam] = data.pullRequestReviewState ?? null

    valueList.push(
      `
        (
          $(${activityIdParam}), 
          $(${memberIdParam}), 
          $(${objectMemberIdParam}), 
          $(${organizationIdParam}), 
          $(${conversationIdParam}), 
          $(${parentIdParam}), 
          $(${segmentIdParam}), 
          $(${platformParam}), 
          $(${usernameParam}), 
          $(${objectMemberUsernameParam}), 
          $(${sourceIdParam}), 
          $(${sourceParentIdParam}),
          $(${typeParam}), 
          $(${timestampParam}), 
          $(${channelParam}), 
          $(${sentimentScoreParam}), 
          $(${gitInsertionsParam}), 
          $(${gitDeletionsParam}), 
          $(${scoreParam}), 
          $(${isContributionParam}), 
          $(${pullRequestReviewStateParam}), 
          now(), 
          now()
        )`,
    )
  }

  await qe.result(
    `
    INSERT INTO "activityRelations" (
            "activityId", 
            "memberId", 
            "objectMemberId", 
            "organizationId",
            "conversationId",
            "parentId",
            "segmentId",
            "platform",
            "username",
            "objectMemberUsername",
            "sourceId",
            "sourceParentId",
            "type",
            "timestamp",
            "channel",
            "sentimentScore",
            "gitInsertions",
            "gitDeletions",
            "score",
            "isContribution",
            "pullRequestReviewState",
            "createdAt", 
            "updatedAt")
    VALUES ${valueList.join(',')}

    ON CONFLICT ("timestamp", "platform", "type", "sourceId", "channel", "segmentId")
    DO UPDATE 
    SET 
        "updatedAt" = EXCLUDED."updatedAt",
        "memberId" = EXCLUDED."memberId",
        "objectMemberId" = EXCLUDED."objectMemberId",
        "organizationId" = EXCLUDED."organizationId",
        "platform" = EXCLUDED."platform",
        "username" = EXCLUDED."username",
        "objectMemberUsername" = EXCLUDED."objectMemberUsername",
        "sourceId" = EXCLUDED."sourceId",
        "sourceParentId" = EXCLUDED."sourceParentId",
        "type" = EXCLUDED."type",
        "timestamp" = EXCLUDED."timestamp",
        "channel" = EXCLUDED."channel",
        "sentimentScore" = EXCLUDED."sentimentScore",
        "gitInsertions" = EXCLUDED."gitInsertions",
        "gitDeletions" = EXCLUDED."gitDeletions",
        "score" = EXCLUDED."score",
        "isContribution" = EXCLUDED."isContribution",
        "pullRequestReviewState" = EXCLUDED."pullRequestReviewState";
    `,
    params,
  )
}

export async function updateActivityRelationsById(
  qe: QueryExecutor,
  data: IActivityRelationUpdateById,
): Promise<void> {
  const fields: string[] = []

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && key !== 'activityId') {
      fields.push(`"${key}" = $(${key})`)
    }
  }

  if (fields.length === 0) return

  const query = `UPDATE "activityRelations" SET ${fields.join(', ')}, "updatedAt" = now() WHERE "activityId" = $(activityId)`

  await qe.result(query, data)
}

export interface IActivityRelationsCreateData {
  id: string
  memberId: string
  timestamp: string
  createdAt: string
  objectMemberId?: string
  organizationId?: string
  conversationId?: string
  parentId?: string
  segmentId: string
  platform: string
  username: string
  objectMemberUsername?: string
  sourceId: string
  sourceParentId?: string
  type: string
  channel: string
  sentimentScore: number
  gitInsertions: number
  gitDeletions: number
  score: number
  isContribution: boolean
  pullRequestReviewState?: string
}
