import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'

export interface IOrganizationAggregateData {
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

export interface IOrganizationSegments {
  organizationId: string
  segments: string[]
}

export async function cleanupForOganization(qx: QueryExecutor, organizationId: string) {
  return qx.result(
    `
      DELETE FROM "organizationSegmentsAgg"
      WHERE "organizationId" = $(organizationId)
    `,
    {
      organizationId,
    },
  )
}

export async function insertOrganizationSegments(
  qx: QueryExecutor,
  data: IOrganizationAggregateData[],
) {
  try {
    return qx.result(
      prepareBulkInsert(
        'organizationSegmentsAgg',
        [
          'organizationId',
          'segmentId',
          'tenantId',
          'joinedAt',
          'lastActive',
          'activeOn',
          'activityCount',
          'memberCount',
          'avgContributorEngagement',
        ],
        data,
      ),
    )
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function updateOrganizationSegments(
  qx: QueryExecutor,
  data: IOrganizationAggregateData,
) {
  try {
    return qx.result(
      `UPDATE "organizationSegmentsAgg" SET
        "joinedAt" = $(joinedAt),
        "lastActive" = $(lastActive),
        "activeOn" = $(activeOn),
        "activityCount" = $(activityCount),
        "memberCount" = $(memberCount),
        "avgContributorEngagement" = $(avgContributorEngagement)
        WHERE "organizationId" = $(organizationId) AND "segmentId" = $(segmentId)`,
      {
        ...data,
      },
    )
  } catch (e) {
    console.error(e)
    throw e
  }
}

export async function fetchManyOrgSegments(
  qx: QueryExecutor,
  organizationIds: string[],
): Promise<IOrganizationSegments[]> {
  return qx.select(
    `
      SELECT
        "organizationId",
        ARRAY_AGG("segmentId") AS segments
      FROM "organizationSegmentsAgg"
      WHERE "organizationId" = ANY($(organizationIds)::UUID[])
      GROUP BY "organizationId"
    `,
    {
      organizationIds,
    },
  )
}
