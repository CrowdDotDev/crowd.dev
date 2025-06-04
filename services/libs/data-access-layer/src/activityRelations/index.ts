import { IMemberSegmentCoreAggregates } from '../members/types'
import { IOrganizationActivityCoreAggregates } from '../organizations/types'
import { QueryExecutor } from '../queryExecutor'
import { updateTable } from '../utils'

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

interface IActivityRelationsUpdate {
  memberId?: string
  objectMemberId?: string
  organizationId?: string
  conversationId?: string
  parentId?: string
  segmentId?: string
  platform?: string
  username?: string
  objectMemberUsername?: string
}

/**
 * Updates activityRelations table
 * @param qx - Query executor
 * @param data - Update data
 * @param whereClause - SQL WHERE clause (without the WHERE keyword)
 * @param params - Parameters for the WHERE clause
 */
export async function updateActivityRelations(
  qx: QueryExecutor,
  dataToUpdate: Partial<IActivityRelationsUpdate>,
  whereClause: string,
  params: Record<string, unknown> = {},
): Promise<void> {
  return updateTable(qx, 'activityRelations', dataToUpdate, whereClause, params)
}
