import CronTime from 'cron-time-generator'

import {
  READ_DB_CONFIG,
  WRITE_DB_CONFIG,
  getDbConnection,
} from '@crowd/data-access-layer/src/database'
import { insertMemberSegmentAggregates } from '@crowd/data-access-layer/src/members/segments'
import { IMemberSegmentAggregates } from '@crowd/data-access-layer/src/members/types'
import { insertOrganizationSegments } from '@crowd/data-access-layer/src/organizations/segments'
import { IDbOrganizationAggregateData } from '@crowd/data-access-layer/src/organizations/types'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { IJobContext, IJobDefinition } from '../types'

interface ISegment {
  id: string
  parentId: string | null
  grandparentId: string | null
}

interface ISegmentAggregate {
  memberId: string
  activityCount: number
  lastActive: string
  activityTypes: string[]
  activeOn: string[]
  averageSentiment: number | null
}

interface IOrganizationSegmentAggregate {
  organizationId: string
  activityCount: number
  memberCount: number
  joinedAt: string
  lastActive: string
  activeOn: string[]
  avgContributorEngagement: number
}

const job: IJobDefinition = {
  name: 'aggregate-calculation',
  cronTime: CronTime.everyDayAt(3, 0), // 3 AM daily
  timeout: 4 * 60 * 60, // 4 hours
  process: async (ctx) => {
    ctx.log.info('Starting parent and grandparent aggregate calculation job')

    const readDb = await getDbConnection(READ_DB_CONFIG(), 3, 0)
    const writeDb = await getDbConnection(WRITE_DB_CONFIG())
    const readQx = pgpQx(readDb)
    const writeQx = pgpQx(writeDb)

    // Build segment hierarchy mapping
    ctx.log.info('Fetching segment hierarchy...')
    const segments: ISegment[] = await readQx.select(
      `
      SELECT id, "parentId", "grandparentId"
      FROM segments
      WHERE "parentId" IS NOT NULL OR "grandparentId" IS NOT NULL
      `,
    )

    // Separate segments by type
    const projectSegments = segments.filter((s) => s.parentId === null && s.grandparentId !== null)
    const subprojectSegments = segments.filter(
      (s) => s.parentId !== null && s.grandparentId !== null,
    )

    ctx.log.info(
      `Found ${projectSegments.length} project segments and ${subprojectSegments.length} subproject segments`,
    )

    // Build mappings: which subprojects belong to which parent/grandparent
    const subprojectsByParent = new Map<string, string[]>()
    const subprojectsByGrandparent = new Map<string, string[]>()

    for (const sp of subprojectSegments) {
      // Map to parent (project)
      if (sp.parentId) {
        if (!subprojectsByParent.has(sp.parentId)) {
          subprojectsByParent.set(sp.parentId, [])
        }
        subprojectsByParent.get(sp.parentId)?.push(sp.id)
      }

      // Map to grandparent (project group)
      if (sp.grandparentId) {
        if (!subprojectsByGrandparent.has(sp.grandparentId)) {
          subprojectsByGrandparent.set(sp.grandparentId, [])
        }
        subprojectsByGrandparent.get(sp.grandparentId)?.push(sp.id)
      }
    }

    // Calculate member aggregates
    await calculateMemberAggregates(
      ctx,
      readQx,
      writeQx,
      subprojectsByParent,
      subprojectsByGrandparent,
    )

    // Calculate organization aggregates
    await calculateOrganizationAggregates(
      ctx,
      readQx,
      writeQx,
      subprojectsByParent,
      subprojectsByGrandparent,
    )

    ctx.log.info('Aggregate calculation job completed')
  },
}

async function calculateMemberAggregates(
  ctx: IJobContext,
  readQx: QueryExecutor,
  writeQx: QueryExecutor,
  subprojectsByParent: Map<string, string[]>,
  subprojectsByGrandparent: Map<string, string[]>,
): Promise<void> {
  ctx.log.info('Calculating member aggregates for parent segments...')

  let totalProjectAggs = 0
  let totalProjectGroupAggs = 0

  // Process parent (project) level aggregates
  for (const [parentSegmentId, subprojectIds] of subprojectsByParent) {
    const aggregates = await readQx.select(
      `
      SELECT
        "memberId",
        SUM("activityCount") AS "activityCount",
        MAX("lastActive") AS "lastActive",
        ARRAY_AGG(DISTINCT unnested_type) FILTER (WHERE unnested_type IS NOT NULL) AS "activityTypes",
        ARRAY_AGG(DISTINCT unnested_platform) FILTER (WHERE unnested_platform IS NOT NULL) AS "activeOn",
        AVG("averageSentiment") AS "averageSentiment"
      FROM "memberSegmentsAgg"
      LEFT JOIN LATERAL unnest("activityTypes") AS unnested_type ON TRUE
      LEFT JOIN LATERAL unnest("activeOn") AS unnested_platform ON TRUE
      WHERE "segmentId" = ANY($(subprojectIds)::UUID[])
      GROUP BY "memberId"
      `,
      { subprojectIds },
    )

    if (aggregates.length > 0) {
      await upsertMemberAggregates(writeQx, parentSegmentId, aggregates)
      totalProjectAggs += aggregates.length
    }
  }

  ctx.log.info(`Inserted/updated ${totalProjectAggs} member aggregates for project segments`)

  // Process grandparent (project group) level aggregates
  for (const [grandparentSegmentId, subprojectIds] of subprojectsByGrandparent) {
    const aggregates = await readQx.select(
      `
      SELECT
        "memberId",
        SUM("activityCount") AS "activityCount",
        MAX("lastActive") AS "lastActive",
        ARRAY_AGG(DISTINCT unnested_type) FILTER (WHERE unnested_type IS NOT NULL) AS "activityTypes",
        ARRAY_AGG(DISTINCT unnested_platform) FILTER (WHERE unnested_platform IS NOT NULL) AS "activeOn",
        AVG("averageSentiment") AS "averageSentiment"
      FROM "memberSegmentsAgg"
      LEFT JOIN LATERAL unnest("activityTypes") AS unnested_type ON TRUE
      LEFT JOIN LATERAL unnest("activeOn") AS unnested_platform ON TRUE
      WHERE "segmentId" = ANY($(subprojectIds)::UUID[])
      GROUP BY "memberId"
      `,
      { subprojectIds },
    )

    if (aggregates.length > 0) {
      await upsertMemberAggregates(writeQx, grandparentSegmentId, aggregates)
      totalProjectGroupAggs += aggregates.length
    }
  }

  ctx.log.info(
    `Inserted/updated ${totalProjectGroupAggs} member aggregates for project group segments`,
  )
}

async function upsertMemberAggregates(
  writeQx: QueryExecutor,
  segmentId: string,
  aggregates: ISegmentAggregate[],
): Promise<void> {
  const data: IMemberSegmentAggregates[] = aggregates.map((agg) => ({
    memberId: agg.memberId,
    segmentId,
    activityCount: agg.activityCount || 0,
    lastActive: agg.lastActive || '1970-01-01',
    activityTypes: agg.activityTypes || [],
    activeOn: agg.activeOn || [],
    averageSentiment: agg.averageSentiment,
  }))

  await insertMemberSegmentAggregates(writeQx, data)
}

async function calculateOrganizationAggregates(
  ctx: IJobContext,
  readQx: QueryExecutor,
  writeQx: QueryExecutor,
  subprojectsByParent: Map<string, string[]>,
  subprojectsByGrandparent: Map<string, string[]>,
): Promise<void> {
  ctx.log.info('Calculating organization aggregates for parent segments...')

  let totalProjectAggs = 0
  let totalProjectGroupAggs = 0

  // Process parent (project) level aggregates
  for (const [parentSegmentId, subprojectIds] of subprojectsByParent) {
    const aggregates = await readQx.select(
      `
      SELECT
        "organizationId",
        SUM("activityCount") AS "activityCount",
        SUM("memberCount") AS "memberCount",
        MIN("joinedAt") FILTER (WHERE "joinedAt" <> '1970-01-01') AS "joinedAt",
        MAX("lastActive") AS "lastActive",
        ARRAY_AGG(DISTINCT unnested_platform) FILTER (WHERE unnested_platform IS NOT NULL) AS "activeOn",
        COALESCE(ROUND(AVG("avgContributorEngagement")), 0) AS "avgContributorEngagement"
      FROM "organizationSegmentsAgg"
      LEFT JOIN LATERAL unnest("activeOn") AS unnested_platform ON TRUE
      WHERE "segmentId" = ANY($(subprojectIds)::UUID[])
      GROUP BY "organizationId"
      `,
      { subprojectIds },
    )

    if (aggregates.length > 0) {
      await upsertOrganizationAggregates(writeQx, parentSegmentId, aggregates)
      totalProjectAggs += aggregates.length
    }
  }

  ctx.log.info(`Inserted/updated ${totalProjectAggs} organization aggregates for project segments`)

  // Process grandparent (project group) level aggregates
  for (const [grandparentSegmentId, subprojectIds] of subprojectsByGrandparent) {
    const aggregates = await readQx.select(
      `
      SELECT
        "organizationId",
        SUM("activityCount") AS "activityCount",
        SUM("memberCount") AS "memberCount",
        MIN("joinedAt") FILTER (WHERE "joinedAt" <> '1970-01-01') AS "joinedAt",
        MAX("lastActive") AS "lastActive",
        ARRAY_AGG(DISTINCT unnested_platform) FILTER (WHERE unnested_platform IS NOT NULL) AS "activeOn",
        COALESCE(ROUND(AVG("avgContributorEngagement")), 0) AS "avgContributorEngagement"
      FROM "organizationSegmentsAgg"
      LEFT JOIN LATERAL unnest("activeOn") AS unnested_platform ON TRUE
      WHERE "segmentId" = ANY($(subprojectIds)::UUID[])
      GROUP BY "organizationId"
      `,
      { subprojectIds },
    )

    if (aggregates.length > 0) {
      await upsertOrganizationAggregates(writeQx, grandparentSegmentId, aggregates)
      totalProjectGroupAggs += aggregates.length
    }
  }

  ctx.log.info(
    `Inserted/updated ${totalProjectGroupAggs} organization aggregates for project group segments`,
  )
}

async function upsertOrganizationAggregates(
  writeQx: QueryExecutor,
  segmentId: string,
  aggregates: IOrganizationSegmentAggregate[],
): Promise<void> {
  const data: IDbOrganizationAggregateData[] = aggregates.map((agg) => ({
    organizationId: agg.organizationId,
    segmentId,
    activityCount: agg.activityCount || 0,
    memberCount: agg.memberCount || 0,
    joinedAt: agg.joinedAt || '1970-01-01',
    lastActive: agg.lastActive || '1970-01-01',
    activeOn: agg.activeOn || [],
    avgContributorEngagement: agg.avgContributorEngagement || 0,
  }))

  await insertOrganizationSegments(writeQx, data)
}

export default job
