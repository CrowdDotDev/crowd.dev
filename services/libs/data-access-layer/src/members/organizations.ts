import {
  IMemberOrganization,
  IMemberOrganizationAffiliationOverride,
  IMemberRoleWithOrganization,
  OrganizationSource,
} from '@crowd/types'

import {
  changeOverride,
  deleteAffiliationOverrides,
  findOverrides,
} from '../member_organization_affiliation_overrides'
import { QueryExecutor } from '../queryExecutor'

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export async function fetchManyMemberOrgsWithOrgData(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<Map<string, IMemberRoleWithOrganization[]>> {
  const memberRoles = (await qx.select(
    `
      SELECT mo.*, o."displayName" as "organizationName", o.logo as "organizationLogo"
      FROM "memberOrganizations" mo
      join "organizations" o on mo."organizationId" = o.id
      WHERE mo."memberId" in ($(memberIds:csv))
      AND mo."deletedAt" IS NULL;
    `,
    {
      memberIds,
    },
  )) as IMemberRoleWithOrganization[]

  const resultMap = new Map<string, IMemberRoleWithOrganization[]>()
  for (const memberId of memberIds) {
    const roles = memberRoles.filter((r) => r.memberId === memberId)
    resultMap.set(memberId, roles)
  }

  return resultMap
}

export async function createMemberOrganization(
  qx: QueryExecutor,
  memberId: string,
  data: Partial<IMemberOrganization>,
): Promise<string | undefined> {
  const result = await qx.selectOneOrNone(
    `
        INSERT INTO "memberOrganizations"("memberId", "organizationId", "dateStart", "dateEnd", "title", "source", "createdAt", "updatedAt")
        VALUES($(memberId), $(organizationId), $(dateStart), $(dateEnd), $(title), $(source), now(), now())
        on conflict do nothing returning id;
    `,
    {
      memberId,
      organizationId: data.organizationId,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      title: data.title || null,
      source: data.source || null,
    },
  )

  if (result) {
    return result.id
  }
}

export async function createOrUpdateMemberOrganizations(
  qx: QueryExecutor,
  memberId: string,
  organizationId: string,
  source: string,
  title: string | null | undefined,
  dateStart: string | null | undefined,
  dateEnd: string | null | undefined,
): Promise<void> {
  if (dateStart) {
    // clean up organizations without dates if we're getting ones with dates
    await qx.result(
      `
          UPDATE "memberOrganizations"
          SET "deletedAt" = NOW()
          WHERE "memberId" = $(memberId)
          AND "title" = $(title)
          AND "organizationId" = $(organizationId)
          AND "dateStart" IS NULL
          AND "dateEnd" IS NULL
        `,
      {
        memberId,
        title,
        organizationId,
      },
    )
  } else {
    const rows = await qx.select(
      `
          SELECT COUNT(*) AS count FROM "memberOrganizations"
          WHERE "memberId" = $(memberId)
          AND "title" = $(title)
          AND "organizationId" = $(organizationId)
          AND "dateStart" IS NOT NULL
          AND "deletedAt" IS NULL
        `,
      {
        memberId,
        title,
        organizationId,
      },
    )
    const row = rows[0] as any
    if (row.count > 0) {
      // if we're getting organization without dates, but there's already one with dates, don't insert
      return
    }
  }

  let conflictCondition = `("memberId", "organizationId", "dateStart", "dateEnd")`
  if (!dateEnd) {
    conflictCondition = `("memberId", "organizationId", "dateStart") WHERE "dateEnd" IS NULL`
  }
  if (!dateStart) {
    conflictCondition = `("memberId", "organizationId") WHERE "dateStart" IS NULL AND "dateEnd" IS NULL`
  }

  const onConflict =
    source === OrganizationSource.UI
      ? `ON CONFLICT ${conflictCondition} DO UPDATE SET "title" = $(title), "dateStart" = $(dateStart), "dateEnd" = $(dateEnd), "deletedAt" = NULL, "source" = $(source)`
      : 'ON CONFLICT DO NOTHING'

  await qx.result(
    `
        INSERT INTO "memberOrganizations" ("memberId", "organizationId", "createdAt", "updatedAt", "title", "dateStart", "dateEnd", "source")
        VALUES ($(memberId), $(organizationId), NOW(), NOW(), $(title), $(dateStart), $(dateEnd), $(source))
        ${onConflict}
      `,
    {
      memberId,
      organizationId,
      title: title || null,
      dateStart: dateStart || null,
      dateEnd: dateEnd || null,
      source: source || null,
    },
  )
}

export async function updateMemberOrganization(
  qx: QueryExecutor,
  memberId: string,
  id: string,
  data: Partial<IMemberOrganization>,
): Promise<void> {
  await qx.result(
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
  await qx.result(
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

export enum EntityField {
  memberId = 'memberId',
  organizationId = 'organizationId',
}

export interface IMergeStrat {
  entityIdField: EntityField
  intersectBasedOnField: EntityField
  entityId(a: IMemberOrganization): string
  intersectBasedOn(a: IMemberOrganization): string
  worthMerging(a: IMemberOrganization, b: IMemberOrganization): boolean
  targetMemberId(role: IMemberOrganization): string
  targetOrganizationId(role: IMemberOrganization): string
}

const MemberMergeStrat = (primaryMemberId: string): IMergeStrat => ({
  entityIdField: EntityField.memberId,
  intersectBasedOnField: EntityField.organizationId,
  entityId(role: IMemberOrganization): string {
    return role.memberId
  },
  intersectBasedOn(role: IMemberOrganization): string {
    return role.organizationId
  },
  worthMerging(a: IMemberOrganization, b: IMemberOrganization): boolean {
    return a.memberId === b.memberId
  },
  targetMemberId(): string {
    return primaryMemberId
  },
  targetOrganizationId(role: IMemberOrganization): string {
    return role.organizationId
  },
})

const OrgMergeStrat = (primaryOrganizationId: string): IMergeStrat => ({
  entityIdField: EntityField.organizationId,
  intersectBasedOnField: EntityField.memberId,
  entityId(role: IMemberOrganization): string {
    return role.organizationId
  },
  intersectBasedOn(role: IMemberOrganization): string {
    return role.memberId
  },
  worthMerging(a: IMemberOrganization, b: IMemberOrganization): boolean {
    return a.organizationId === b.organizationId
  },
  targetMemberId(role: IMemberOrganization): string {
    return role.memberId
  },
  targetOrganizationId(): string {
    return primaryOrganizationId
  },
})

export async function findRolesBelongingToBothEntities(
  qx: QueryExecutor,
  primaryId: string,
  secondaryId: string,
  entityIdField: EntityField,
  intersectBasedOnField: EntityField,
): Promise<IMemberOrganization[]> {
  const results = await qx.select(
    `
    SELECT  mo.*
    FROM "memberOrganizations" AS mo
    WHERE mo."deletedAt" is null and
       mo."${intersectBasedOnField}" IN (
        SELECT "${intersectBasedOnField}"
        FROM "memberOrganizations"
        WHERE "${entityIdField}" = $(primaryId)
    )
    AND mo."${intersectBasedOnField}" IN (
        SELECT "${intersectBasedOnField}"
        FROM "memberOrganizations"
        WHERE "${entityIdField}" = $(secondaryId))
    AND mo."${entityIdField}" IN ($(primaryId), $(secondaryId));

  `,
    {
      primaryId,
      secondaryId,
    },
  )

  return results as IMemberOrganization[]
}

export async function findNonIntersectingRoles(
  qx: QueryExecutor,
  primaryId: string,
  secondaryId: string,
  entityIdField: EntityField,
  intersectBasedOnField: EntityField,
): Promise<IMemberOrganization[]> {
  const remainingRoles = (await qx.select(
    `
      SELECT *
      FROM "memberOrganizations"
      WHERE "${entityIdField}" = $(secondaryId)
      AND "deletedAt" IS NULL
      AND "${intersectBasedOnField}" NOT IN (
          SELECT "${intersectBasedOnField}"
          FROM "memberOrganizations"
          WHERE "${entityIdField}" = $(primaryId)
          AND "deletedAt" IS NULL
      );
    `,
    {
      primaryId,
      secondaryId,
    },
  )) as IMemberOrganization[]

  return remainingRoles
}

export async function removeMemberRole(qx: QueryExecutor, role: IMemberOrganization) {
  let deleteMemberRole = `DELETE FROM "memberOrganizations"
                                          WHERE
                                          "organizationId" = $(organizationId) and
                                          "memberId" = $(memberId)`

  const replacements: Record<string, unknown> = {
    organizationId: role.organizationId,
    memberId: role.memberId,
  }

  if (role.dateStart === null) {
    deleteMemberRole += ` and "dateStart" is null `
  } else {
    deleteMemberRole += ` and "dateStart" = $(dateStart) `
    replacements.dateStart = (role.dateStart as Date).toISOString()
  }

  if (role.dateEnd === null) {
    deleteMemberRole += ` and "dateEnd" is null `
  } else {
    deleteMemberRole += ` and "dateEnd" = $(dateEnd) `
    replacements.dateEnd = (role.dateEnd as Date).toISOString()
  }

  await qx.select(deleteMemberRole, replacements)
}

export async function addMemberRole(
  qx: QueryExecutor,
  role: IMemberOrganization,
): Promise<string | undefined> {
  const query = `
        insert into "memberOrganizations" ("memberId", "organizationId", "createdAt", "updatedAt", "title", "dateStart", "dateEnd", "source")
        values ($(memberId), $(organizationId), NOW(), NOW(), $(title), $(dateStart), $(dateEnd), $(source))
        on conflict do nothing returning id;
  `

  const row = await qx.selectOneOrNone(query, {
    memberId: role.memberId,
    organizationId: role.organizationId,
    title: role.title || null,
    dateStart: role.dateStart,
    dateEnd: role.dateEnd,
    source: role.source || null,
  })

  if (row) {
    return row.id
  }
}

async function moveRolesBetweenEntities(
  qx: QueryExecutor,
  primaryId: string,
  secondaryId: string,
  mergeStrat: IMergeStrat,
) {
  // first, handle members that belong to both organizations,
  // then make a full update on remaining org2 members (that doesn't belong to o1)
  const rolesForBothEntities = await findRolesBelongingToBothEntities(
    qx,
    primaryId,
    secondaryId,
    mergeStrat.entityIdField,
    mergeStrat.intersectBasedOnField,
  )

  const primaryRoles = rolesForBothEntities.filter((m) => mergeStrat.entityId(m) === primaryId)
  const secondaryRoles = rolesForBothEntities.filter((m) => mergeStrat.entityId(m) === secondaryId)

  const primaryMemberAffiliationOverrides = await findOverrides(qx, primaryId)
  const secondaryMemberAffiliationOverrides = await findOverrides(qx, secondaryId)

  await mergeRoles(qx, primaryRoles, secondaryRoles, mergeStrat, {
    primary: primaryMemberAffiliationOverrides,
    secondary: secondaryMemberAffiliationOverrides,
  })

  // update rest of the o2 members
  const remainingRoles = await findNonIntersectingRoles(
    qx,
    primaryId,
    secondaryId,
    mergeStrat.entityIdField,
    mergeStrat.intersectBasedOnField,
  )

  for (const role of remainingRoles) {
    // delete any existing affiliation override for the role to avoid foreign key conflicts
    // and reapply it with the new memberOrganizationId
    const existingOverride = secondaryMemberAffiliationOverrides.find(
      (o) => o.memberOrganizationId === role.id,
    )

    if (existingOverride) {
      await deleteAffiliationOverrides(qx, role.memberId, [role.id])
    }

    await removeMemberRole(qx, role)
    const newRoleId = await addMemberRole(qx, {
      title: role.title,
      dateStart: role.dateStart,
      dateEnd: role.dateEnd,
      memberId: mergeStrat.targetMemberId(role),
      organizationId: mergeStrat.targetOrganizationId(role),
      source: role.source,
      deletedAt: role.deletedAt,
    })

    if (existingOverride && newRoleId) {
      let overrideToApply = existingOverride

      if (existingOverride.isPrimaryWorkExperience) {
        // Check if primary member has any overrides with isPrimaryWorkExperience set
        const primaryHasPrimaryWorkExp = primaryMemberAffiliationOverrides.some(
          (o) => o.isPrimaryWorkExperience,
        )

        if (primaryHasPrimaryWorkExp) {
          overrideToApply = {
            ...existingOverride,
            isPrimaryWorkExperience: false,
          }
        }
      }

      await changeOverride(qx, {
        ...overrideToApply,
        memberId: mergeStrat.targetMemberId(role),
        memberOrganizationId: newRoleId,
      })
    }
  }
}

export async function moveMembersBetweenOrganizations(
  qx: QueryExecutor,
  secondaryOrganizationId: string,
  primaryOrganizationId: string,
): Promise<void> {
  await moveRolesBetweenEntities(
    qx,
    primaryOrganizationId,
    secondaryOrganizationId,
    OrgMergeStrat(primaryOrganizationId),
  )
}

export async function moveOrgsBetweenMembers(
  qx: QueryExecutor,
  primaryMemberId: string,
  secondaryMemberId: string,
): Promise<void> {
  await moveRolesBetweenEntities(
    qx,
    primaryMemberId,
    secondaryMemberId,
    MemberMergeStrat(primaryMemberId),
  )
}

export async function mergeRoles(
  qx: QueryExecutor,
  primaryRoles: IMemberOrganization[],
  secondaryRoles: IMemberOrganization[],
  mergeStrat: IMergeStrat,
  memberAffiliationOverrides: {
    primary: IMemberOrganizationAffiliationOverride[]
    secondary: IMemberOrganizationAffiliationOverride[]
  },
) {
  let removeRoles: IMemberOrganization[] = []
  let addRoles: IMemberOrganization[] = []
  const affiliationOverridesToRecreate: {
    role: IMemberOrganization
    override: IMemberOrganizationAffiliationOverride
  }[] = []

  for (const memberOrganization of secondaryRoles) {
    // if dateEnd and dateStart isn't available, we don't need to move but delete it from org2
    if (memberOrganization.dateStart === null && memberOrganization.dateEnd === null) {
      removeRoles.push(memberOrganization)
    }
    // it's a current role, also check org1 to see which one starts earlier
    else if (memberOrganization.dateStart !== null && memberOrganization.dateEnd === null) {
      const currentRoles = primaryRoles.filter(
        (mo) =>
          mergeStrat.worthMerging(mo, memberOrganization) &&
          mo.dateStart !== null &&
          mo.dateEnd === null,
      )
      if (currentRoles.length === 0) {
        // no current role in org1, add the memberOrganization to org1
        addRoles.push(memberOrganization)
      } else if (currentRoles.length === 1) {
        const currentRole = currentRoles[0]
        if (new Date(memberOrganization.dateStart) <= new Date(currentRoles[0].dateStart)) {
          // add a new role with earlier dateStart
          addRoles.push({
            id: currentRole.id,
            dateStart: (memberOrganization.dateStart as Date).toISOString(),
            dateEnd: null,
            memberId: currentRole.memberId,
            organizationId: currentRole.organizationId,
            title: currentRole.title,
            source: currentRole.source,
          })

          // remove current role
          removeRoles.push(currentRole)
        }

        // delete role from org2
        removeRoles.push(memberOrganization)
      } else {
        throw new Error(`Member ${memberOrganization.memberId} has more than one current roles.`)
      }
    } else if (memberOrganization.dateStart === null && memberOrganization.dateEnd !== null) {
      throw new Error(`Member organization with dateEnd and without dateStart!`)
    } else {
      // both dateStart and dateEnd exists
      const foundIntersectingRoles = primaryRoles.filter((mo) => {
        const primaryStart = new Date(mo.dateStart)
        const primaryEnd = new Date(mo.dateEnd)
        const secondaryStart = new Date(memberOrganization.dateStart)
        const secondaryEnd = new Date(memberOrganization.dateEnd)

        return (
          mo.memberId === memberOrganization.memberId &&
          mo.dateStart !== null &&
          mo.dateEnd !== null &&
          ((secondaryStart < primaryStart && secondaryEnd > primaryStart) ||
            (primaryStart < secondaryStart && secondaryEnd < primaryEnd) ||
            (secondaryStart < primaryStart && secondaryEnd > primaryEnd) ||
            (primaryStart < secondaryStart && secondaryEnd > primaryEnd))
        )
      })

      // rebuild dateRanges using intersecting roles coming from primary and secondary organizations
      const startDates = [...foundIntersectingRoles, memberOrganization].map((org) =>
        new Date(org.dateStart).getTime(),
      )
      const endDates = [...foundIntersectingRoles, memberOrganization].map((org) =>
        new Date(org.dateEnd).getTime(),
      )

      addRoles.push({
        dateStart: new Date(Math.min.apply(null, startDates)).toISOString(),
        dateEnd: new Date(Math.max.apply(null, endDates)).toISOString(),
        memberId: mergeStrat.targetMemberId(memberOrganization),
        organizationId: mergeStrat.targetOrganizationId(memberOrganization),
        title:
          foundIntersectingRoles.length > 0
            ? foundIntersectingRoles[0].title
            : memberOrganization.title,
        source:
          foundIntersectingRoles.length > 0
            ? foundIntersectingRoles[0].source
            : memberOrganization.source,
      })

      // we'll delete all roles that intersect with incoming org member roles and create a merged role
      for (const r of foundIntersectingRoles) {
        removeRoles.push(r)
      }
    }

    const existingOverrides = [
      ...memberAffiliationOverrides.primary,
      ...memberAffiliationOverrides.secondary,
    ]

    for (const removeRole of removeRoles) {
      // delete affiliation overrides before removing roles to avoid foreign key conflicts
      const existingOverride = existingOverrides.find(
        (o) => o.memberOrganizationId === removeRole.id,
      )

      if (existingOverride) {
        await deleteAffiliationOverrides(qx, removeRole.memberId, [removeRole.id])
        affiliationOverridesToRecreate.push({
          role: removeRole,
          override: existingOverride,
        })
      }

      await removeMemberRole(qx, removeRole)
    }

    for (const addRole of addRoles) {
      const newRoleId = await addMemberRole(qx, addRole)

      // Only apply affiliation overrides if role was successfully created
      // This handles duplicates conflicts gracefully
      if (newRoleId) {
        // Find all affiliation overrides that could apply to this new role
        // Match by organization + title only:
        // - Dates differ between merged (addRole) and original (item.role) roles
        // - Original roles were deleted; dates won't match
        // - We apply overrides from contributing roles to the merged one
        const relevantOverrides = affiliationOverridesToRecreate.filter(
          (item) =>
            item.role.organizationId === addRole.organizationId &&
            item.role.title === addRole.title,
        )

        let overrideToApply: IMemberOrganizationAffiliationOverride | undefined
        if (relevantOverrides.length > 0) {
          // Prefer the override from the primary role if it exists
          const primaryOverride = relevantOverrides.find((item) =>
            primaryRoles.some((primaryRole) => primaryRole.id === item.role.id),
          )

          // If we found a primary override, use it, otherwise, use the first one
          overrideToApply = primaryOverride?.override || relevantOverrides[0]?.override
        }

        if (overrideToApply) {
          await changeOverride(qx, {
            ...overrideToApply,
            memberId: mergeStrat.targetMemberId(addRole),
            memberOrganizationId: newRoleId,
          })
        }
      }
    }

    addRoles = []
    removeRoles = []
  }
}
