import { IMemberOrganization } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberOrganizations(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberOrganization[]> {
  return qx.select(
    `
      SELECT *
      FROM "memberOrganizations"
      WHERE "memberId" = $(memberId)
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
        INSERT INTO "memberOrganizations"("memberId", "organizationId", "dateStart", "dateEnd", "title")
        VALUES($(memberId), $(organizationId), $(dateStart), $("dateStart"), $(title))
        ON CONFLICT DO NOTHING;
    `,
    {
      memberId,
      organizationId: data.organizationId,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      title: data.title,
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
            title = $(title)
          WHERE "memberId" = $(memberId) AND "id" = $(id);
      `,
    {
      memberId,
      id,
      organizationId: data.organizationId,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      title: data.title,
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
        DELETE FROM "memberOrganizations"
        WHERE "memberId" = $(memberId) AND "id" = $(id);
    `,
    {
      memberId,
      id,
    },
  )
}
