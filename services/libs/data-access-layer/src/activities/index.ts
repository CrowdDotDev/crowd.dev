import { QueryExecutor } from '../queryExecutor'

export interface IOrganizationSegmentAggregates {
  organizationId: string
  segmentId: string
  tenantId: string

  joinedAt: string
  lastActive: string
  activeOn: string[]
  activityCount: number
  memberCount: number
  avgContributorEngagement: number
}

export async function getOrgAggregates(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IOrganizationSegmentAggregates[]> {
  return qx.select(
    `
      WITH
        segments_with_children AS (
          SELECT
              UNNEST(ARRAY["id", "parentId", "grandparentId"]) AS segment_id,
              s.id AS subproject
          FROM segments s
          WHERE type = 'subproject';
        )
      SELECT
          o."id" AS "organizationId",
          s.segment_id AS "segmentId",
          o."tenantId",
          COALESCE(MIN(a.timestamp), '1970-01-01') AS "joinedAt",
          MAX(a.timestamp) AS "lastActive",
          ARRAY_AGG(DISTINCT a.platform) AS "activeOn",
          COUNT(DISTINCT a.id) AS "activityCount",
          COUNT(DISTINCT a."memberId") AS "memberCount",
          COALESCE(ROUND(AVG(a.score)), 0) AS "avgContributorEngagement"
      FROM activities a
      JOIN organizations o ON o."id" = a."organizationId"
      JOIN segments_with_children s ON s.subproject = a."segmentId"
      WHERE a."organizationId" = $(organizationId)
      GROUP BY o."id", s.segment_id, o."tenantId"
    `,
    {
      organizationId,
    },
  )
}
