import { v4 as uuid } from 'uuid'

import {
  IChangeAffiliationOverrideData,
  IMemberOrganizationAffiliationOverride,
} from '@crowd/types'

import { fetchOrganizationMemberAffiliations } from '../members'
import { QueryExecutor } from '../queryExecutor'

export async function changeMemberOrganizationAffiliationOverrides(
  qx: QueryExecutor,
  data: IChangeAffiliationOverrideData[],
): Promise<void> {
  if (!Array.isArray(data) || data.length === 0) {
    return
  }

  const rows: IMemberOrganizationAffiliationOverride[] = []

  for (const d of data) {
    if (
      !d.memberId ||
      !d.memberOrganizationId ||
      (d.allowAffiliation === undefined && d.isPrimaryWorkExperience === undefined)
    ) {
      continue
    }

    rows.push({
      id: uuid(),
      memberId: d.memberId,
      memberOrganizationId: d.memberOrganizationId,
      allowAffiliation: d.allowAffiliation,
      isPrimaryWorkExperience: d.isPrimaryWorkExperience,
    })
  }

  if (rows.length === 0) {
    return
  }

  const valuesSql = rows
    .map(
      (_, i) => `
        (
          $(id_${i}),
          $(memberId_${i}),
          $(memberOrganizationId_${i}),
          $(allowAffiliation_${i}),
          $(isPrimaryWorkExperience_${i})
        )
      `,
    )
    .join(', ')

  const params = rows.reduce(
    (acc, row, i) => {
      acc[`id_${i}`] = row.id
      acc[`memberId_${i}`] = row.memberId
      acc[`memberOrganizationId_${i}`] = row.memberOrganizationId
      acc[`allowAffiliation_${i}`] = row.allowAffiliation
      acc[`isPrimaryWorkExperience_${i}`] = row.isPrimaryWorkExperience
      return acc
    },
    {} as Record<string, unknown>,
  )

  await qx.result(
    `
      INSERT INTO "memberOrganizationAffiliationOverrides" (
        id,
        "memberId",
        "memberOrganizationId",
        "allowAffiliation",
        "isPrimaryWorkExperience"
      )
      VALUES ${valuesSql}
      ON CONFLICT ("memberId", "memberOrganizationId")
      DO UPDATE SET
        "allowAffiliation" = COALESCE(EXCLUDED."allowAffiliation", "memberOrganizationAffiliationOverrides"."allowAffiliation"),
        "isPrimaryWorkExperience" = COALESCE(EXCLUDED."isPrimaryWorkExperience", "memberOrganizationAffiliationOverrides"."isPrimaryWorkExperience");
    `,
    params,
  )
}

export async function findMemberAffiliationOverrides(
  qx: QueryExecutor,
  memberId: string,
  memberOrganizationIds?: string[],
): Promise<IMemberOrganizationAffiliationOverride[]> {
  const whereClause = ['"memberId" = $(memberId)']

  if (memberOrganizationIds?.length) {
    whereClause.push(`"memberOrganizationId" IN ($(memberOrganizationIds:csv))`)
  }

  const overrides: IMemberOrganizationAffiliationOverride[] = await qx.select(
    `
      SELECT 
        id,
        "memberId",
        "memberOrganizationId",
        coalesce("allowAffiliation", true) as "allowAffiliation",
        coalesce("isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
      FROM "memberOrganizationAffiliationOverrides"
      WHERE ${whereClause.join(' AND ')}
    `,
    {
      memberId,
      memberOrganizationIds,
    },
  )

  if (!memberOrganizationIds?.length) {
    return overrides
  }

  // Map over requested memberOrganizationIds and provide defaults for missing ones
  const foundMemberOrgIds = new Set(overrides.map((override) => override.memberOrganizationId))

  const results = memberOrganizationIds.map((memberOrganizationId) => {
    if (foundMemberOrgIds.has(memberOrganizationId)) {
      return overrides.find((override) => override.memberOrganizationId === memberOrganizationId)
    }
    return {
      allowAffiliation: true,
      isPrimaryWorkExperience: false,
      memberId,
      memberOrganizationId,
    }
  })

  return results
}

export async function findOrganizationAffiliationOverrides(
  qx: QueryExecutor,
  organizationId: string,
): Promise<IMemberOrganizationAffiliationOverride[]> {
  return qx.select(
    `
      SELECT
        moa.id,
        moa."memberId",
        moa."memberOrganizationId",
        coalesce(moa."allowAffiliation", true) as "allowAffiliation",
        coalesce(moa."isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
      FROM "memberOrganizationAffiliationOverrides" moa
      JOIN "memberOrganizations" mo ON moa."memberOrganizationId" = mo.id
      WHERE mo."organizationId" = $(organizationId)
      AND mo."deletedAt" IS NULL
    `,
    {
      organizationId,
    },
  )
}

export async function findPrimaryWorkExperiencesOfMember(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberOrganizationAffiliationOverride[]> {
  const overrides: IMemberOrganizationAffiliationOverride[] = await qx.select(
    `
      SELECT 
        id,
        "memberId",
        "memberOrganizationId",
        coalesce("allowAffiliation", true) as "allowAffiliation",
        coalesce("isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
      FROM "memberOrganizationAffiliationOverrides"
      WHERE "memberId" = $(memberId)
      AND "isPrimaryWorkExperience" = true
    `,
    {
      memberId,
    },
  )

  return overrides
}

export async function applyOrganizationAffiliationBlockToMembers(
  qx: QueryExecutor,
  organizationId: string,
  allowAffiliation: boolean,
) {
  let afterId

  do {
    const orgMemberAffiliations = await fetchOrganizationMemberAffiliations(
      qx,
      organizationId,
      500,
      afterId,
    )

    if (orgMemberAffiliations.length === 0) break

    await changeMemberOrganizationAffiliationOverrides(
      qx,
      orgMemberAffiliations.map((mo) => ({
        memberId: mo.memberId,
        memberOrganizationId: mo.id,
        allowAffiliation,
      })),
    )

    afterId = orgMemberAffiliations[orgMemberAffiliations.length - 1].id
  } while (afterId)
}
