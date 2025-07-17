import { IMemberOrganization, IMemberRoleWithOrganization } from '@crowd/types'

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

export async function fetchManyMemberOrgsForMerge(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<Map<string, IMemberRoleWithOrganization[]>> {
  const memberRoles = (await qx.select(
    `
      SELECT mo.*, o."displayName" as "organizationName", o.logo as "organizationLogo"
      FROM "memberOrganizations" mo
      join "organizations" o on mo."organizationId" = o.id
      WHERE mo."memberId" in ($(memberId:csv))
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
): Promise<void> {
  await qx.result(
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

export async function addMemberRole(qx: QueryExecutor, role: IMemberOrganization): Promise<void> {
  const query = `
        insert into "memberOrganizations" ("memberId", "organizationId", "createdAt", "updatedAt", "title", "dateStart", "dateEnd", "source")
        values ($(memberId), $(organizationId), NOW(), NOW(), $(title), $(dateStart), $(dateEnd), $(source))
        on conflict do nothing;
  `

  await qx.select(query, {
    memberId: role.memberId,
    organizationId: role.organizationId,
    title: role.title || null,
    dateStart: role.dateStart,
    dateEnd: role.dateEnd,
    source: role.source || null,
  })
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

  await this.mergeRoles(primaryRoles, secondaryRoles, mergeStrat)

  // update rest of the o2 members
  const remainingRoles = await findNonIntersectingRoles(
    qx,
    primaryId,
    secondaryId,
    mergeStrat.entityIdField,
    mergeStrat.intersectBasedOnField,
  )

  for (const role of remainingRoles) {
    await removeMemberRole(qx, role)
    await addMemberRole(qx, {
      title: role.title,
      dateStart: role.dateStart,
      dateEnd: role.dateEnd,
      memberId: mergeStrat.targetMemberId(role),
      organizationId: mergeStrat.targetOrganizationId(role),
      source: role.source,
      deletedAt: role.deletedAt,
    })
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
) {
  let removeRoles: IMemberOrganization[] = []
  let addRoles: IMemberOrganization[] = []

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

    for (const removeRole of removeRoles) {
      await removeMemberRole(qx, removeRole)
    }

    for (const addRole of addRoles) {
      await addMemberRole(qx, addRole)
    }

    addRoles = []
    removeRoles = []
  }
}
