import { v4 as uuid } from 'uuid'

import { IChangeAffiliationOverrideData, IMemberAffiliation, IMemberOrganizationAffiliationOverride } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function changeOverride(
  qx: QueryExecutor,
  data: IChangeAffiliationOverrideData,
): Promise<void> {
  if (!data.memberId || !data.organizationId || (data.allowAffiliation == undefined && data.isPrimaryOrganization == undefined)) {
    return;
  }

  const updateFields = [];
  if (data.allowAffiliation !== undefined) {
    updateFields.push(`"allowAffiliation" = $(allowAffiliation)`);
  }
  if (data.isPrimaryOrganization !== undefined) {
    updateFields.push(`"isPrimaryOrganization" = $(isPrimaryOrganization)`);
  }

  const updateQuery = updateFields.length > 0 ? `DO UPDATE SET ${updateFields.join(', ')}` : 'DO NOTHING';

  await qx.result(
    `
      INSERT INTO "memberOrganizationAffiliationOverrides" (
          id, 
          "memberId", 
          "organizationId", 
          "allowAffiliation", 
          "isPrimaryOrganization"
      )
      VALUES (
          $(id),
          $(memberId),
          $(organizationId),
          $(allowAffiliation),
          $(isPrimaryOrganization)
      )
      ON CONFLICT ("memberId", "organizationId") 
      ${updateQuery};
    `,
    {
      id: uuid(),
      memberId: data.memberId,
      organizationId: data.organizationId,
      allowAffiliation: data.allowAffiliation ?? null,
      isPrimaryOrganization: data.isPrimaryOrganization ?? null,
    },
  );

}

export async function findOverrides(
  qx: QueryExecutor,
  memberId: string,
  organizationIds: string[],
): Promise<IMemberOrganizationAffiliationOverride[]> {
  const overrides = await qx.select(
    `
      SELECT 
        id,
        "memberId",
        "organizationId",
        coalesce("allowAffiliation", true) as "allowAffiliation",
        coalesce("isPrimaryOrganization", false) as "isPrimaryOrganization"
      FROM "memberOrganizationAffiliationOverrides"
      WHERE "memberId" = $(memberId)
      AND "organizationId" IN ($(organizationIds:csv))
    `,
    {
      memberId,
      organizationIds,
    },
  );

  const foundOrgIds = new Set(overrides.map((override) => override.organizationId));

  const results = organizationIds.map((organizationId) => {
    if (foundOrgIds.has(organizationId)) {
      return overrides.find((override) => override.organizationId === organizationId);
    }
    return {
      allowAffiliation: true,
      isPrimaryOrganization: false,
      memberId,
      organizationId,
    };
  });

  return results;
}