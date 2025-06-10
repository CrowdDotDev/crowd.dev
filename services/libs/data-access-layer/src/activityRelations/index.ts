import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { IMemberSegmentCoreAggregates } from '../members/types'
import { IOrganizationActivityCoreAggregates } from '../organizations/types'
import { QueryExecutor, formatQuery } from '../queryExecutor'
import { prepareUpdate } from '../utils'

import type { IActivityRelationsUpdate, IDbActivityRelations } from './types'

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

export async function getActivityRelations<T extends keyof IDbActivityRelations>(
  qx: QueryExecutor,
  select: T[],
  whereClause: string,
  limit = 1000,
): Promise<Pick<IDbActivityRelations, T>[]> {
  return qx.select(
    `
    select ${select.map((col) => `"${col}"`).join(', ')}
    from "activityRelations"
    ${whereClause ? `where ${whereClause}` : ''}
    order by "activityId" asc
    limit $(limit)
  `,
    { limit },
  )
}

export async function updateActivityRelations(
  qx: QueryExecutor,
  dataToUpdate: Partial<IActivityRelationsUpdate>,
  whereClause: string,
  params: Record<string, unknown> = {},
): Promise<void> {
  return qx.result(
    prepareUpdate(
      'activityRelations',
      {
        ...dataToUpdate,
        updatedAt: 'CURRENT_TIMESTAMP',
      },
      whereClause,
      params,
    ),
  )
}

/**
 * Moves activity relations from secondary to primary member in batches of 5000 rows.
 * If identities are provided, only moves activities matching those platform/username combinations.
 */
export async function moveActivityRelationsBetweenMembers(
  qx: QueryExecutor,
  primaryId: string,
  secondaryId: string,
  identities?: IMemberIdentity[],
): Promise<void> {
  const BATCH_SIZE = 5000
  const SELECT_COLUMNS = ['activityId'] as const satisfies (keyof IDbActivityRelations)[]

  const whereClause = (lastId?: string) => {
    const conditions = [`"memberId" = $(secondaryId)`]
    const params: Record<string, unknown> = { secondaryId }

    // If identities are provided, filter by platform/username combinations
    if (identities?.length) {
      const tuples = identities
        .filter((i) => i.type === MemberIdentityType.USERNAME)
        .map((i) => `('${i.platform}', '${i.value}')`)
        .join(', ')

      if (tuples) {
        conditions.push(`("platform", "username") in (${tuples})`)
      }
    }

    if (lastId) {
      conditions.push(`"activityId" > $(lastId)`)
      params.lastId = lastId
    }

    return formatQuery(conditions.join(' and '), params)
  }

  let activityRelations = await getActivityRelations(qx, SELECT_COLUMNS, whereClause(), BATCH_SIZE)

  while (activityRelations.length > 0) {
    await updateActivityRelations(
      qx,
      { memberId: primaryId },
      '"activityId" in ($(activityIds:csv))',
      {
        activityIds: activityRelations.map((row) => row.activityId),
      },
    )

    const lastId = activityRelations[activityRelations.length - 1].activityId

    // next batch
    activityRelations = await getActivityRelations(
      qx,
      SELECT_COLUMNS,
      whereClause(lastId),
      BATCH_SIZE,
    )
  }
}

/**
 * Moves activity relations from secondary to primary organization in batches of 5000 rows.
 */
export async function moveActivityRelationsBetweenOrganizations(
  qx: QueryExecutor,
  primaryId: string,
  secondaryId: string,
): Promise<void> {
  const BATCH_SIZE = 5000
  const SELECT_COLUMNS = ['activityId'] as const satisfies (keyof IDbActivityRelations)[]

  const whereClause = (lastId?: string) => {
    const conditions = [`"organizationId" = $(secondaryId)`]
    const params: Record<string, unknown> = { secondaryId }

    if (lastId) {
      conditions.push(`"activityId" > $(lastId)`)
      params.lastId = lastId
    }

    return formatQuery(conditions.join(' and '), params)
  }

  let activityRelations = await getActivityRelations(qx, SELECT_COLUMNS, whereClause(), BATCH_SIZE)

  while (activityRelations.length > 0) {
    await updateActivityRelations(
      qx,
      { organizationId: primaryId },
      '"activityId" in ($(activityIds:csv))',
      {
        activityIds: activityRelations.map((row) => row.activityId),
      },
    )

    const lastId = activityRelations[activityRelations.length - 1].activityId

    // next batch
    activityRelations = await getActivityRelations(
      qx,
      SELECT_COLUMNS,
      whereClause(lastId),
      BATCH_SIZE,
    )
  }
}
