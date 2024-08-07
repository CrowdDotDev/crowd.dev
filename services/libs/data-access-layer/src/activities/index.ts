import { SegmentType } from '@crowd/types'
import { IMemberSegmentAggregates } from '../members/types'
import { IDbOrganizationAggregateData } from '../organizations'
import { QueryExecutor } from '../queryExecutor'

function groupByField(segmentType: SegmentType) {
  switch (segmentType) {
    case SegmentType.SUB_PROJECT:
      return 's.id'
    case SegmentType.PROJECT:
      return 's."parentId"'
    case SegmentType.PROJECT_GROUP:
      return 's."grandparentId"'
  }

  throw new Error(`Invalid segment type: ${segmentType}`)
}

export async function getOrgAggregates(
  qx: QueryExecutor,
  organizationId: string,
  groupBy: SegmentType,
): Promise<IDbOrganizationAggregateData[]> {
  return qx.select(
    `
      SELECT
          o."id" AS "organizationId",
          ${groupByField(groupBy)} AS "segmentId",
          o."tenantId",
          COALESCE(MIN(a.timestamp), '1970-01-01') AS "joinedAt",
          MAX(a.timestamp) AS "lastActive",
          ARRAY_AGG(DISTINCT a.platform) AS "activeOn",
          COUNT(DISTINCT a.id) AS "activityCount",
          COUNT(DISTINCT a."memberId") AS "memberCount",
          COALESCE(ROUND(AVG(a.score)), 0) AS "avgContributorEngagement"
      FROM activities a
      JOIN organizations o ON o."id" = a."organizationId"
      JOIN segments s ON s.id = a."segmentId"
      WHERE a."organizationId" = $(organizationId)
      GROUP BY 1, 2, 3
    `,
    {
      organizationId,
    },
  )
}

export async function getMemberAggregates(
  qx: QueryExecutor,
  memberId: string,
  groupBy: SegmentType,
): Promise<IMemberSegmentAggregates[]> {
  return qx.select(
    `
      SELECT
          m."id" AS "memberId",
          ${groupByField(groupBy)} AS "segmentId",
          m."tenantId",
          COUNT(DISTINCT a.id) AS "activityCount",
          MAX(a.timestamp) AS "lastActive",
          ARRAY_AGG(DISTINCT CONCAT(a.platform, ':', a.type)) FILTER (WHERE a.platform IS NOT NULL) AS "activityTypes",
          ARRAY_AGG(DISTINCT a.platform) FILTER (WHERE a.platform IS NOT NULL) AS "activeOn",
          ROUND(AVG((a.sentiment ->> 'sentiment')::NUMERIC(5, 2)), 2) AS "averageSentiment"
      FROM activities a
      JOIN members m ON m."id" = a."memberId"
      JOIN segments s ON s.id = a."segmentId"
      WHERE a."memberId" = $(memberId)
      GROUP BY 1, 2, 3
    `,
    {
      memberId,
    },
  )
}
