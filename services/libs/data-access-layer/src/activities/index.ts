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
}

export async function getOrgAggregates(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IOrganizationSegmentAggregates[]> {
  return qx.select(
    `
      SELECT
          a."organizationId",
          a."tenantId",
          a."segmentId",
          count(DISTINCT a."memberId")  AS "memberCount",
          count(DISTINCT a.id)          AS "activityCount",
          max(a.timestamp)              AS "lastActive",
          min(a.timestamp)              AS "joinedAt",
          ARRAY_AGG(DISTINCT a.platform) AS "activeOn"
      FROM mv_activities_cube a
      WHERE a."organizationId" = $(organizationId)
      GROUP BY a."organizationId", a."tenantId", a."segmentId"
    `,
    {
      organizationId,
    },
  )
}
