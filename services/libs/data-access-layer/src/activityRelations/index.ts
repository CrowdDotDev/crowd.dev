import { IMemberSegmentCoreAggregates } from '../members/types'
import { IOrganizationActivityCoreAggregates } from '../organizations/types'
import { QueryExecutor } from '../queryExecutor'

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

export interface IActivityRelationDuplicateGroup {
  activityIds: string[]
  timestamp: string
  platform: string
  type: string
  sourceId: string
  channel: string
  segmentId: string
}

export async function fetchActivityRelationsDuplicateGroups(
  qx: QueryExecutor,
  limit: number,
  cursor?: Omit<IActivityRelationDuplicateGroup, 'activityIds'>,
): Promise<IActivityRelationDuplicateGroup[]> {
  return qx.select(
    `
    WITH grouped_activity_relations AS (
      SELECT
        "timestamp", "platform", "type", "sourceId", "channel", "segmentId",
        array_agg("activityId" ORDER BY "updatedAt" DESC) AS "activityIds"
      FROM "activityRelations"
      WHERE
        "timestamp" IS NOT NULL AND "platform" IS NOT NULL AND 
        "type" IS NOT NULL AND "sourceId" IS NOT NULL AND 
        "channel" IS NOT NULL AND "segmentId" IS NOT NULL
        ${
          cursor
            ? `AND ("timestamp", "platform", "type", "sourceId", "channel", "segmentId") >
                 ($(timestamp), $(platform), $(type), $(sourceId), $(channel), $(segmentId))`
            : ''
        }
      GROUP BY
        "timestamp", "platform", "type", "sourceId", "channel", "segmentId"
      HAVING COUNT(*) > 1
      ORDER BY "timestamp", "platform", "type", "sourceId", "channel", "segmentId"
    )
    SELECT * FROM grouped_activity_relations LIMIT $(limit);
    `,
    { limit, ...(cursor || {}) },
  )
}

export async function deleteActivityRelationsById(
  qx: QueryExecutor,
  activityIds: string[],
): Promise<void> {
  return qx.result(
    `
    DELETE FROM "activityRelations" WHERE "activityId" IN ($(activityIds:csv));
    `,
    { activityIds },
  )
}
