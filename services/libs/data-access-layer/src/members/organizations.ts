import { IMemberOrganization } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberOrganizations(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberOrganization[]> {
  return qx.select(
    `
      SELECT "id", "organizationId", "dateStart", "dateEnd", "title", "memberId", "source"
      FROM "memberOrganizations"
      WHERE "memberId" = $(memberId)
      AND "deletedAt" IS NULL
      ORDER BY
          CASE
              WHEN "dateEnd" IS NULL AND "dateStart" IS NOT NULL THEN 1
              WHEN "dateEnd" IS NOT NULL AND "dateStart" IS NOT NULL THEN 2
              WHEN "dateEnd" IS NULL AND "dateStart" IS NULL THEN 3
              ELSE 4
              END ASC,
          "dateEnd" DESC,
          "dateStart" DESC
    `,
    {
      memberId,
    },
  )
}

export async function fetchManyMemberOrgs(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<{ memberId: string; organizations: IMemberOrganization[] }[]> {
  return qx.select(
    `
      SELECT
        mo."memberId",
        JSONB_AGG(mo ORDER BY mo."createdAt") AS "organizations"
      FROM "memberOrganizations" mo
      WHERE mo."memberId" IN ($(memberIds:csv))
        AND mo."deletedAt" IS NULL
      GROUP BY mo."memberId"
    `,
    {
      memberIds,
    },
  )
}

export async function createMemberOrganization(
  qx: QueryExecutor,
  memberId: string,
  data: Partial<IMemberOrganization>,
): Promise<void> {
  return qx.result(
    `
        INSERT INTO "memberOrganizations"("memberId", "organizationId", "dateStart", "dateEnd", "title", "source", "createdAt", "updatedAt")
        VALUES($(memberId), $(organizationId), $(dateStart), $(dateEnd), $(title), $(source), $(date), $(date))
    `,
    {
      memberId,
      organizationId: data.organizationId,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      title: data.title,
      source: data.source,
      date: new Date().toISOString(),
    },
  )
}

export async function updateMemberOrganization(
  qx: QueryExecutor,
  memberId: string,
  id: string,
  data: Partial<IMemberOrganization>,
): Promise<void> {
  return qx.result(
    `
          UPDATE "memberOrganizations"
          SET
            "organizationId" = $(organizationId),
            "dateStart" = $(dateStart),
            "dateEnd" = $(dateEnd),
            title = $(title),
            source = $(source),
            "updatedAt" = $(updatedAt)
          WHERE "memberId" = $(memberId) AND "id" = $(id);
      `,
    {
      memberId,
      id,
      organizationId: data.organizationId,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      title: data.title,
      source: data.source,
      updatedAt: new Date().toISOString(),
    },
  )
}

export async function deleteMemberOrganization(
  qx: QueryExecutor,
  memberId: string,
  id: string,
): Promise<void> {
  return qx.result(
    `
      UPDATE "memberOrganizations"
      SET "deletedAt" = NOW()
      WHERE "memberId" = $(memberId) AND "id" = $(id);
    `,
    {
      memberId,
      id,
    },
  )
}

export async function cleanSoftDeletedMemberOrganization(
  qx: QueryExecutor,
  memberId: string,
  organizationId: string,
  data: Partial<IMemberOrganization>,
): Promise<void> {
  const whereClause = `
    "memberId" = $(memberId)
    AND "organizationId" = $(organizationId)
    AND (("dateStart" = $(dateStart)) OR ("dateStart" IS NULL AND $(dateStart) IS NULL))
    AND (("dateEnd" = $(dateEnd)) OR ("dateEnd" IS NULL AND $(dateEnd) IS NULL))
    AND "deletedAt" IS NOT NULL
  `

  const params = {
    memberId,
    organizationId,
    dateStart: data.dateStart ?? null,
    dateEnd: data.dateEnd ?? null,
  }

  return qx.tx(async (tx) => {
    await tx.result(
      `
        DELETE FROM "memberOrganizationAffiliationOverrides"
        WHERE "memberOrganizationId" IN (
          SELECT "id" FROM "memberOrganizations" WHERE ${whereClause}
        )
      `,
      params,
    )

    await tx.result(
      `
        DELETE FROM "memberOrganizations"
        WHERE ${whereClause}
      `,
      params,
    )
  })
}
