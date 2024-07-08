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
                pg.id AS segment_id,
                'project-group' AS segment_type,
                sp.id AS subproject
            FROM segments pg
            JOIN segments p ON p."parentSlug" = pg.slug AND p."grandparentSlug" IS NULL
            JOIN segments sp ON sp."parentSlug" = p.slug AND sp."grandparentSlug" = p."parentSlug"
            WHERE pg."parentSlug" IS NULL
              AND pg."grandparentSlug" IS NULL

            UNION ALL

            SELECT
                p.id AS segment_id,
                'project' AS segment_type,
                sp.id AS subproject
            FROM segments p
            JOIN segments sp ON sp."parentSlug" = p.slug AND sp."grandparentSlug" = p."parentSlug"
            WHERE p."grandparentSlug" IS NULL

            UNION ALL

            SELECT
                sp.id AS segment_id,
                'subproject' AS segment_type,
                sp.id AS subproject
            FROM segments sp
            WHERE sp."parentSlug" IS NOT NULL AND sp."grandparentSlug" IS NOT NULL
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
