export * from './ilp'
export * from './sql'
export * from './types'

// import { IMemberSegmentAggregates } from '../members/types'
// import { IDbOrganizationAggregateData } from '../organizations'
// import { QueryExecutor } from '../queryExecutor'

// export async function getOrgAggregates(
//   qx: QueryExecutor,
//   organizationId: string,
// ): Promise<IDbOrganizationAggregateData[]> {
//   return qx.select(
//     `
//       WITH
//         segments_with_children AS (
//           SELECT
//               UNNEST(ARRAY["id", "parentId", "grandparentId"]) AS segment_id,
//               s.id AS subproject
//           FROM segments s
//           WHERE type = 'subproject'
//         )
//       SELECT
//           o."id" AS "organizationId",
//           s.segment_id AS "segmentId",
//           o."tenantId",
//           COALESCE(MIN(a.timestamp), '1970-01-01') AS "joinedAt",
//           MAX(a.timestamp) AS "lastActive",
//           ARRAY_AGG(DISTINCT a.platform) AS "activeOn",
//           COUNT(DISTINCT a.id) AS "activityCount",
//           COUNT(DISTINCT a."memberId") AS "memberCount",
//           COALESCE(ROUND(AVG(a.score)), 0) AS "avgContributorEngagement"
//       FROM activities a
//       JOIN organizations o ON o."id" = a."organizationId"
//       JOIN segments_with_children s ON s.subproject = a."segmentId"
//       WHERE a."organizationId" = $(organizationId)
//       GROUP BY o."id", s.segment_id, o."tenantId"
//     `,
//     {
//       organizationId,
//     },
//   )
// }

// export async function getMemberAggregates(
//   qx: QueryExecutor,
//   memberId: string,
// ): Promise<IMemberSegmentAggregates[]> {
//   return qx.select(
//     `
//       WITH
//           segments_with_children AS (
//             SELECT
//               UNNEST(ARRAY["id", "parentId", "grandparentId"]) AS segment_id,
//               s.id AS subproject
//             FROM segments s
//             WHERE type = 'subproject'
//           )
//       SELECT
//           m."id" AS "memberId",
//           s.segment_id AS "segmentId",
//           m."tenantId",
//           COUNT(DISTINCT a.id) AS "activityCount",
//           MAX(a.timestamp) AS "lastActive",
//           ARRAY_AGG(DISTINCT CONCAT(a.platform, ':', a.type)) FILTER (WHERE a.platform IS NOT NULL) AS "activityTypes",
//           ARRAY_AGG(DISTINCT a.platform) FILTER (WHERE a.platform IS NOT NULL) AS "activeOn",
//           ROUND(AVG((a.sentiment ->> 'sentiment')::NUMERIC(5, 2)), 2) AS "averageSentiment"
//       FROM activities a
//       JOIN members m ON m."id" = a."memberId"
//       JOIN segments_with_children s ON s.subproject = a."segmentId"
//       WHERE a."memberId" = $(memberId)
//       GROUP BY m."id", s.segment_id, m."tenantId"
//     `,
//     {
//       memberId,
//     },
//   )
// }
