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

export async function moveActivityRelationsToAnotherMember(
  qe: QueryExecutor,
  fromId: string,
  toId: string,
  batchSize = 5000,
) {
  let rowsUpdated

  do {
    const result = await qe.result(
      `
          UPDATE "activityRelations"
          SET "memberId" = $(toId)
          WHERE "activityId" in (
            select "activityId" from "activityRelations"
            where "memberId" = $(fromId)
            limit $(batchSize)
          )
          returning "activityId"
        `,
      {
        toId,
        fromId,
        batchSize,
      },
    )

    rowsUpdated = result.length
  } while (rowsUpdated === batchSize)
}

export async function moveActivityRelationsWithIdentityToAnotherMember(
  qe: QueryExecutor,
  fromId: string,
  toId: string,
  username: string,
  platform: string,
  batchSize = 5000,
) {
  let rowsUpdated

  do {
    const result = await qe.result(
      `
          UPDATE "activityRelations"
          SET "memberId" = $(toId)
          WHERE "activityId" in (
            select "activityId" from "activityRelations"
            where 
              "memberId" = $(fromId) and
              "username" = $(username) and
              "platform" = $(platform)
            limit $(batchSize)
          )
          returning "activityId"
        `,
      {
        toId,
        fromId,
        username,
        platform,
        batchSize,
      },
    )

    rowsUpdated = result.length
  } while (rowsUpdated === batchSize)
}

export async function moveActivityRelationsToAnotherOrganization(
  qe: QueryExecutor,
  fromId: string,
  toId: string,
  batchSize = 5000,
) {
  let rowsUpdated

  do {
    const result = await qe.result(
      `
          UPDATE "activityRelations"
          SET "organizationId" = $(toId)
          WHERE "activityId" in (
            select "activityId" from "activityRelations"
            where "organizationId" = $(fromId)
            limit $(batchSize)
          )
          returning "activityId"
        `,
      {
        toId,
        fromId,
        batchSize,
      },
    )

    rowsUpdated = result.length
  } while (rowsUpdated === batchSize)
}
