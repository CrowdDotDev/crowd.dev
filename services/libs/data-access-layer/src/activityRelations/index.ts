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

export async function fetchActivityRelationsDuplicateGroup(
  qx: QueryExecutor,
): Promise<{ activityId: string; timestamp: string }[]> {
  return qx.select(
    `
      WITH next_group AS (
          SELECT "timestamp", "platform", "type", "sourceId", "channel", "segmentId"
          FROM "activityRelations"
          WHERE "timestamp" IS NOT NULL
          AND "platform" IS NOT NULL
          AND "type" IS NOT NULL
          AND "sourceId" IS NOT NULL
          AND "channel" IS NOT NULL
          AND "segmentId" IS NOT NULL
          GROUP BY "timestamp", "platform", "type", "sourceId", "channel", "segmentId"
          HAVING COUNT(*) > 1
          LIMIT 1
      )
      SELECT
          ar."activityId",
          ar."timestamp",
          ar."updatedAt"
      FROM "activityRelations" ar
      JOIN next_group ng
        ON ar."timestamp" = ng."timestamp"
      AND ar."platform" = ng."platform"
      AND ar."type" = ng."type"
      AND ar."sourceId" = ng."sourceId"
      AND ar."channel" = ng."channel"
      AND ar."segmentId" = ng."segmentId"
      ORDER BY ar."updatedAt" DESC;
    `,
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
