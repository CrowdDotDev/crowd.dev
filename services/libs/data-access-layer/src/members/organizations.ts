import {
  IMemberOrganization,
  IMemberOrganizationAffiliationOverride,
  IMemberRoleWithOrganization,
  OrganizationSource,
} from '@crowd/types'

import {
  changeOverride,
  deleteAffiliationOverrides,
  findMemberAffiliationOverrides,
  findOrganizationAffiliationOverrides,
} from '../member_organization_affiliation_overrides'
import { EntityType } from '../old/apps/script_executor_worker/types'
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

export async function deleteMemberOrganizations(
  qx: QueryExecutor,
  memberId: string,
  ids?: string[],
  softDelete = true,
): Promise<void> {
  // Base query depends on soft vs hard delete
  const baseQuery = softDelete
    ? 'UPDATE "memberOrganizations" SET "deletedAt" = NOW()'
    : 'DELETE FROM "memberOrganizations"'

  // Build WHERE clause
  const conditions = ['"memberId" = $(memberId)']
  const params: Record<string, unknown> = { memberId }

  if (ids?.length) {
    conditions.push(`"id" IN ($(ids:csv))`)
    params.ids = ids
  }

  const whereClause = conditions.join(' AND ')
  const query = `${baseQuery} WHERE ${whereClause};`

  await qx.tx(async (tx) => {
    // First delete from memberOrganizationAffiliationOverrides using the same conditions
    await tx.result(
      `DELETE FROM "memberOrganizationAffiliationOverrides" 
       WHERE "memberOrganizationId" IN (
         SELECT "id" FROM "memberOrganizations" 
         WHERE ${whereClause}
       )`,
      params,
    )

    // Then perform the soft/hard delete on memberOrganizations
    await tx.result(query, params)
  })
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
  console.log(`[DEBUG removeMemberRole] Deleting role:`, {
    id: role.id,
    memberId: role.memberId,
    organizationId: role.organizationId,
    title: role.title,
    dateStart: role.dateStart,
    dateEnd: role.dateEnd,
  })

  if (role.id) {
    await deleteAffiliationOverrides(qx, role.memberId, [role.id])
  }

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

  console.log(`[DEBUG removeMemberRole] Query:`, deleteMemberRole.replace(/\s+/g, ' '))
  await qx.result(deleteMemberRole, replacements)
  console.log(`[DEBUG removeMemberRole] Delete completed`)
}

export async function addMemberRole(
  qx: QueryExecutor,
  role: IMemberOrganization,
): Promise<string | undefined> {
  console.log(`[DEBUG addMemberRole] Adding role:`, {
    memberId: role.memberId,
    organizationId: role.organizationId,
    title: role.title,
    dateStart: role.dateStart,
    dateEnd: role.dateEnd,
  })

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
    console.log(`[DEBUG addMemberRole] Created with ID: ${row.id}`)
    return row.id
  } else {
    console.log(`[DEBUG addMemberRole] Conflict - role already exists`)
  }
}

async function moveRolesBetweenEntities(
  qx: QueryExecutor,
  primaryId: string,
  secondaryId: string,
  mergeStrat: IMergeStrat,
  entityType: EntityType,
) {
  console.log(`[DEBUG moveRolesBetweenEntities] Starting ${entityType} merge:`, {
    primaryId,
    secondaryId,
    entityIdField: mergeStrat.entityIdField,
    intersectBasedOnField: mergeStrat.intersectBasedOnField,
  })

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

  console.log(`[DEBUG moveRolesBetweenEntities] Found intersecting roles:`, {
    primaryCount: primaryRoles.length,
    secondaryCount: secondaryRoles.length,
  })

  const findAffiliationOverrides =
    entityType === EntityType.MEMBER
      ? findMemberAffiliationOverrides
      : findOrganizationAffiliationOverrides

  const primaryAffiliationOverrides = await findAffiliationOverrides(qx, primaryId)
  const secondaryAffiliationOverrides = await findAffiliationOverrides(qx, secondaryId)

  console.log(`[DEBUG moveRolesBetweenEntities] Found affiliation overrides:`, {
    primaryOverridesCount: primaryAffiliationOverrides.length,
    secondaryOverridesCount: secondaryAffiliationOverrides.length,
  })

  await mergeRoles(
    qx,
    primaryRoles,
    secondaryRoles,
    primaryAffiliationOverrides,
    secondaryAffiliationOverrides,
    mergeStrat,
  )

  // update rest of the o2 members
  const remainingRoles = await findNonIntersectingRoles(
    qx,
    primaryId,
    secondaryId,
    mergeStrat.entityIdField,
    mergeStrat.intersectBasedOnField,
  )

  console.log(
    `[DEBUG moveRolesBetweenEntities] Processing ${remainingRoles.length} remaining (non-intersecting) roles`,
  )

  // Process non-intersecting roles: these are roles that exist only in secondary entity
  // We need to move them to primary entity and preserve their overrides
  for (const role of remainingRoles) {
    console.log(`[DEBUG moveRolesBetweenEntities] Processing remaining role:`, {
      id: role.id,
      memberId: role.memberId,
      organizationId: role.organizationId,
    })

    // Check if this role has an affiliation override
    const existingOverride = secondaryAffiliationOverrides.find(
      (o) => o.memberOrganizationId === role.id,
    )

    if (existingOverride) {
      console.log(
        `[DEBUG moveRolesBetweenEntities] Found override for role ${role.id}, will recreate after transfer`,
      )
    }

    // Remove the old role (this will also clean up its override via removeMemberRole)
    await removeMemberRole(qx, role)

    // Add the role to the primary entity
    const newRoleId = await addMemberRole(qx, {
      title: role.title,
      dateStart: role.dateStart,
      dateEnd: role.dateEnd,
      memberId: mergeStrat.targetMemberId(role),
      organizationId: mergeStrat.targetOrganizationId(role),
      source: role.source,
      deletedAt: role.deletedAt,
    })

    // If the old role had an override and we successfully created the new role, recreate the override
    if (existingOverride && newRoleId) {
      let overrideToApply = existingOverride

      // Only keep isPrimaryWorkExperience if primary doesn't already have one
      if (existingOverride.isPrimaryWorkExperience) {
        const primaryHasPrimaryWorkExp = primaryAffiliationOverrides.some(
          (o) => o.isPrimaryWorkExperience,
        )

        if (primaryHasPrimaryWorkExp) {
          console.log(
            `[DEBUG moveRolesBetweenEntities] Primary already has isPrimaryWorkExperience, setting to false`,
          )
          overrideToApply = {
            ...existingOverride,
            isPrimaryWorkExperience: false,
          }
        }
      }

      console.log(`[DEBUG moveRolesBetweenEntities] Recreating override for new role ${newRoleId}`)
      await changeOverride(qx, {
        ...overrideToApply,
        memberId: mergeStrat.targetMemberId(role),
        memberOrganizationId: newRoleId,
      })
    }
  }

  console.log(`[DEBUG moveRolesBetweenEntities] Non-intersecting roles processed:`, {
    totalProcessed: remainingRoles.length,
  })
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
    EntityType.ORGANIZATION,
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
    EntityType.MEMBER,
  )
}

export async function mergeRoles(
  qx: QueryExecutor,
  primaryRoles: IMemberOrganization[],
  secondaryRoles: IMemberOrganization[],
  primaryAffiliationOverrides: IMemberOrganizationAffiliationOverride[],
  secondaryAffiliationOverrides: IMemberOrganizationAffiliationOverride[],
  mergeStrat: IMergeStrat,
) {
  console.log(
    `[DEBUG mergeRoles] Starting with ${primaryRoles.length} primary, ${secondaryRoles.length} secondary roles`,
  )
  console.log(
    `[DEBUG mergeRoles] Secondary affiliation overrides:`,
    secondaryAffiliationOverrides.map((o) => ({
      id: o.id,
      memberOrganizationId: o.memberOrganizationId,
      allowAffiliation: o.allowAffiliation,
      isPrimaryWorkExperience: o.isPrimaryWorkExperience,
    })),
  )

  const allExistingOverrides = [...primaryAffiliationOverrides, ...secondaryAffiliationOverrides]
  const removeRoles: IMemberOrganization[] = []
  const addRoles: (IMemberOrganization & { originalRoleId?: string })[] = []
  const affiliationOverridesToRecreate: {
    role: IMemberOrganization
    override: IMemberOrganizationAffiliationOverride
  }[] = []

  // Phase 1: Analyze all secondary roles and build the complete plan
  for (const memberOrganization of secondaryRoles) {
    console.log(`[DEBUG] Processing secondary role:`, {
      id: memberOrganization.id,
      memberId: memberOrganization.memberId,
      organizationId: memberOrganization.organizationId,
      title: memberOrganization.title,
      dateStart: memberOrganization.dateStart,
      dateEnd: memberOrganization.dateEnd,
    })

    // if dateEnd and dateStart isn't available, we don't need to move but delete it from org2
    if (memberOrganization.dateStart === null && memberOrganization.dateEnd === null) {
      console.log(`[DEBUG] Role has no dates - adding to removeRoles`)
      removeRoles.push(memberOrganization)
    }
    // it's a current role, also check org1 to see which one starts earlier
    else if (memberOrganization.dateStart !== null && memberOrganization.dateEnd === null) {
      console.log(`[DEBUG] Role is current (no end date) - checking for conflicts`)
      const currentRoles = primaryRoles.filter(
        (mo) =>
          mergeStrat.worthMerging(mo, memberOrganization) &&
          mo.dateStart !== null &&
          mo.dateEnd === null,
      )
      console.log(`[DEBUG] Found ${currentRoles.length} current roles in primary`)

      if (currentRoles.length === 0) {
        // no current role in org1, add the memberOrganization to org1
        console.log(`[DEBUG] No current role conflict - will move role to primary entity`)

        const transformedRole = {
          title: memberOrganization.title,
          dateStart: memberOrganization.dateStart,
          dateEnd: memberOrganization.dateEnd,
          memberId: mergeStrat.targetMemberId(memberOrganization),
          organizationId: mergeStrat.targetOrganizationId(memberOrganization),
          source: memberOrganization.source,
          originalRoleId: memberOrganization.id, // Track which secondary role this came from
        }

        console.log(`[DEBUG] Transformed role:`, {
          originalRoleId: memberOrganization.id,
          originalMemberId: memberOrganization.memberId,
          originalOrgId: memberOrganization.organizationId,
          newMemberId: transformedRole.memberId,
          newOrgId: transformedRole.organizationId,
        })

        // Add transformed role to primary entity
        addRoles.push(transformedRole)
        // Remove the original role from secondary entity
        removeRoles.push(memberOrganization)
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
        console.log(`[DEBUG] Removing secondary current role from removeRoles`)
        removeRoles.push(memberOrganization)
      } else {
        console.log(`[DEBUG] ERROR: Multiple current roles found`)
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
  }

  // Phase 2: Execute batch removal of roles
  // Note: removeMemberRole handles override cleanup automatically
  console.log(`[DEBUG] === REMOVE PHASE: ${removeRoles.length} roles ===`)
  for (const removeRole of removeRoles) {
    // Track if this role has an override that we need to recreate later
    const existingOverride = allExistingOverrides.find(
      (o) => o.memberOrganizationId === removeRole.id,
    )

    console.log(`[DEBUG] Removing role ${removeRole.id}, has override: ${!!existingOverride}`)
    if (existingOverride) {
      // Store the override so we can recreate it for the new merged role
      affiliationOverridesToRecreate.push({
        role: removeRole,
        override: existingOverride,
      })
    }

    // Remove the role (this will also clean up its override via removeMemberRole)
    await removeMemberRole(qx, removeRole)
  }

  // Phase 3: Execute batch addition of roles and recreate overrides
  console.log(`[DEBUG] === ADD PHASE: ${addRoles.length} roles ===`)
  for (const addRole of addRoles) {
    console.log(`[DEBUG addMemberRole] Adding role:`, {
      memberId: addRole.memberId,
      organizationId: addRole.organizationId,
      title: addRole.title,
      dateStart: addRole.dateStart,
      dateEnd: addRole.dateEnd,
    })

    const newRoleId = await addMemberRole(qx, addRole)

    if (newRoleId) {
      // Role was successfully created, apply affiliation overrides
      // Find overrides by matching the original role ID if available, otherwise fallback to member + title matching
      console.log(`[DEBUG] Looking for overrides to apply to new role ${newRoleId}:`, {
        addRoleMemberId: addRole.memberId,
        addRoleOrgId: addRole.organizationId,
        addRoleTitle: addRole.title,
        originalRoleId: addRole.originalRoleId,
        availableOverrides: affiliationOverridesToRecreate.length,
      })

      const relevantOverrides = affiliationOverridesToRecreate.filter((item) => {
        // If we tracked the original role ID, use exact matching
        if (addRole.originalRoleId) {
          return item.role.id === addRole.originalRoleId
        }
        // Otherwise, fallback to member + title matching (for merged roles with date changes)
        return item.role.memberId === addRole.memberId && item.role.title === addRole.title
      })

      console.log(`[DEBUG] Found ${relevantOverrides.length} relevant overrides for new role`)

      let overrideToApply: IMemberOrganizationAffiliationOverride | undefined
      if (relevantOverrides.length > 0) {
        // Prefer the override from the primary role if it exists
        const primaryOverride = relevantOverrides.find((item) =>
          primaryRoles.some((primaryRole) => primaryRole.id === item.role.id),
        )

        // If we found a primary override, use it, otherwise, use the first one
        overrideToApply = primaryOverride?.override || relevantOverrides[0]?.override
        console.log(`[DEBUG] Selected override:`, {
          isPrimary: !!primaryOverride,
          allowAffiliation: overrideToApply.allowAffiliation,
          isPrimaryWorkExperience: overrideToApply.isPrimaryWorkExperience,
        })
      }

      if (overrideToApply) {
        console.log(`[DEBUG] Applying override to new role ${newRoleId}`)
        await changeOverride(qx, {
          ...overrideToApply,
          memberId: mergeStrat.targetMemberId(addRole),
          memberOrganizationId: newRoleId,
        })
      }
    } else {
      // Role already exists (duplicate), need to transfer override to existing role
      console.log(`[DEBUG addMemberRole] Conflict - role already exists, looking for existing role`)

      // Find the existing role in primary that matches this addRole
      const existingPrimaryRole = primaryRoles.find(
        (pr) =>
          pr.memberId === addRole.memberId &&
          pr.organizationId === addRole.organizationId &&
          pr.title === addRole.title &&
          ((pr.dateStart === null && addRole.dateStart === null) ||
            (pr.dateStart &&
              addRole.dateStart &&
              new Date(pr.dateStart).getTime() === new Date(addRole.dateStart).getTime())) &&
          ((pr.dateEnd === null && addRole.dateEnd === null) ||
            (pr.dateEnd &&
              addRole.dateEnd &&
              new Date(pr.dateEnd).getTime() === new Date(addRole.dateEnd).getTime())),
      )

      if (existingPrimaryRole) {
        console.log(
          `[DEBUG] Found existing primary role ${existingPrimaryRole.id}, transferring overrides`,
        )

        // Find overrides from secondary roles that should be transferred
        // Use original role ID if available for exact matching
        console.log(`[DEBUG] Looking for overrides to transfer (duplicate case):`, {
          addRoleOriginalId: addRole.originalRoleId,
          addRoleMemberId: addRole.memberId,
          addRoleTitle: addRole.title,
        })

        const secondaryOverridesToTransfer = affiliationOverridesToRecreate.filter((item) => {
          const isSecondaryOverride = secondaryAffiliationOverrides.some(
            (so) => so.memberOrganizationId === item.role.id,
          )

          if (!isSecondaryOverride) return false

          // If we have original role ID, use exact match
          if (addRole.originalRoleId) {
            return item.role.id === addRole.originalRoleId
          }

          // Otherwise fallback to member + title matching
          return item.role.memberId === addRole.memberId && item.role.title === addRole.title
        })

        console.log(
          `[DEBUG] Found ${secondaryOverridesToTransfer.length} secondary overrides to transfer`,
        )

        // Also check if there's a direct override on the secondary role we're trying to add
        const directSecondaryOverride = secondaryAffiliationOverrides.find((so) =>
          secondaryRoles.some(
            (sr) =>
              sr.id === so.memberOrganizationId &&
              sr.organizationId === addRole.organizationId &&
              sr.title === addRole.title,
          ),
        )

        if (directSecondaryOverride) {
          secondaryOverridesToTransfer.push({
            role: addRole as IMemberOrganization,
            override: directSecondaryOverride,
          })
        }

        if (secondaryOverridesToTransfer.length > 0) {
          // Get existing override on primary role if any
          const existingPrimaryOverride = primaryAffiliationOverrides.find(
            (po) => po.memberOrganizationId === existingPrimaryRole.id,
          )

          // Merge override properties intelligently
          let finalOverride = secondaryOverridesToTransfer[0].override

          // If primary has isPrimaryWorkExperience, keep it; otherwise use secondary's value
          if (existingPrimaryOverride?.isPrimaryWorkExperience) {
            finalOverride = {
              ...finalOverride,
              isPrimaryWorkExperience: true,
            }
          } else if (secondaryOverridesToTransfer.some((o) => o.override.isPrimaryWorkExperience)) {
            // Only set isPrimaryWorkExperience if no other primary role has it
            const primaryHasPrimaryWorkExp = primaryAffiliationOverrides.some(
              (o) => o.isPrimaryWorkExperience && o.memberOrganizationId !== existingPrimaryRole.id,
            )

            if (!primaryHasPrimaryWorkExp) {
              finalOverride = {
                ...finalOverride,
                isPrimaryWorkExperience: true,
              }
            }
          }

          // Prefer allowAffiliation: true from either side
          if (existingPrimaryOverride?.allowAffiliation || finalOverride.allowAffiliation) {
            finalOverride = {
              ...finalOverride,
              allowAffiliation: true,
            }
          }

          console.log(`[DEBUG] Applying merged override to existing role ${existingPrimaryRole.id}`)
          await changeOverride(qx, {
            ...finalOverride,
            memberId: existingPrimaryRole.memberId,
            memberOrganizationId: existingPrimaryRole.id,
          })
        }
      }
    }
  }
}
