import { v4 as uuid } from 'uuid'

import {
  IChangeAffiliationOverrideData,
  IMemberOrganizationAffiliationOverride,
} from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function changeOverride(
  qx: QueryExecutor,
  data: IChangeAffiliationOverrideData,
): Promise<void> {
  if (
    !data.memberId ||
    !data.memberOrganizationId ||
    (data.allowAffiliation == undefined && data.isPrimaryWorkExperience == undefined)
  ) {
    return
  }

  // If the user is setting the work experience as primary
  // we should allow affiliations for this work experience as well
  if (data.isPrimaryWorkExperience === true) {
    data.allowAffiliation = true
  }

  const updateFields = []
  if (data.allowAffiliation !== undefined) {
    updateFields.push(`"allowAffiliation" = $(allowAffiliation)`)
  }
  if (data.isPrimaryWorkExperience !== undefined) {
    updateFields.push(`"isPrimaryWorkExperience" = $(isPrimaryWorkExperience)`)
  }

  const updateQuery =
    updateFields.length > 0 ? `DO UPDATE SET ${updateFields.join(', ')}` : 'DO NOTHING'

  await qx.result(
    `
      INSERT INTO "memberOrganizationAffiliationOverrides" (
          id, 
          "memberId", 
          "memberOrganizationId", 
          "allowAffiliation", 
          "isPrimaryWorkExperience"
      )
      VALUES (
          $(id),
          $(memberId),
          $(memberOrganizationId),
          $(allowAffiliation),
          $(isPrimaryWorkExperience)
      )
      ON CONFLICT ("memberId", "memberOrganizationId") 
      ${updateQuery};
    `,
    {
      id: uuid(),
      memberId: data.memberId,
      memberOrganizationId: data.memberOrganizationId,
      allowAffiliation: data.allowAffiliation,
      isPrimaryWorkExperience: data.isPrimaryWorkExperience,
    },
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
