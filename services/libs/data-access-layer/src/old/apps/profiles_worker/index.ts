import _ from 'lodash'
import QueryStream from 'pg-query-stream'

import { DbConnOrTx, DbStore } from '@crowd/database'
import { getServiceChildLogger } from '@crowd/logging'
import { ITenant } from '@crowd/types'

import { insertActivities } from '../../../activities'
import { findMemberAffiliations } from '../../../member_segment_affiliations'
import { formatQuery, pgpQx } from '../../../queryExecutor'
import { IDbActivityCreateData } from '../data_sink_worker/repo/activity.data'

import { IAffiliationsLastCheckedAt, IMemberId } from './types'

const logger = getServiceChildLogger('profiles_worker')

export async function runMemberAffiliationsUpdate(
  pgDb: DbStore,
  qDb: DbConnOrTx,
  memberId: string,
) {
  const qx = pgpQx(pgDb.connection())
  const tsBetween = (start: string, end: string) => {
    return `timestamp BETWEEN '${start}' AND '${end}'`
  }
  const tsAfter = (start: string) => {
    return `timestamp >= '${start}'`
  }

  const tsBetweenOrOpenEnd = (start: string, end: string) => {
    if (!start) {
      return 'TRUE'
    }

    if (end) {
      return tsBetween(start, end)
    }
    return tsAfter(start)
  }

  type Condition = {
    when: string[]
    orgId: string | null
    matches: (activity: IDbActivityCreateData) => boolean
  }

  const condition = ({ when, orgId }: Condition) => {
    return `WHEN ${when.join(' AND ')} THEN ${nullableOrg(orgId)}`
  }

  const nullableOrg = (orgId: string) => (orgId ? `cast('${orgId}' as uuid)` : 'NULL')

  const manualAffiliations = await findMemberAffiliations(qx, memberId)

  const allMemberOrganizations = await qx.select(
    `
      SELECT
        "organizationId",
        "dateStart",
        "dateEnd",
        "createdAt",
        "deletedAt"
      FROM "memberOrganizations"
      WHERE "memberId" = $(memberId)
      ORDER BY "dateStart" DESC
    `,
    { memberId },
  )

  // Filter valid organizations (non-soft-deleted)
  const validMemberOrganizations = allMemberOrganizations.filter((org) => !org.deletedAt)

  // Get all deleted organizationIds to explicitly unaffiliate their activities
  const deletedOrganizationIds = _.uniq(
    allMemberOrganizations.filter((org) => org.deletedAt).map((org) => org.organizationId),
  )

  const orgCases: Condition[] = [
    // Explicitly unaffiliate deleted organizations
    ..._.chain(deletedOrganizationIds)
      .map((orgId) => ({
        when: [`'organizationId'::text = '${orgId}'`],
        matches: (activity) => activity.organizationId === orgId,
        orgId: null,
      }))
      .value(),

    ..._.chain(manualAffiliations)
      .sortBy('dateStart')
      .reverse()
      .map((row) => ({
        when: [`"segmentId" = '${row.segmentId}'`, tsBetweenOrOpenEnd(row.dateStart, row.dateEnd)],
        matches: (activity) => {
          if (activity.segmentId !== row.segmentId) {
            return false
          }

          if (!row.dateStart) {
            return true
          }
          if (row.dateEnd) {
            return activity.timestamp >= row.dateStart && activity.timestamp <= row.dateEnd
          }
          return activity.timestamp >= row.dateStart
        },
        orgId: row.organizationId,
      }))
      .value(),

    ..._.chain(validMemberOrganizations)
      .filter((row) => !!row.dateStart)
      .sortBy('dateStart')
      .reverse()
      .map((row) => ({
        when: [tsBetweenOrOpenEnd(row.dateStart, row.dateEnd)],
        matches: (activity) => {
          if (!row.dateStart) {
            return true
          }
          if (row.dateEnd) {
            return activity.timestamp >= row.dateStart && activity.timestamp <= row.dateEnd
          }
          return activity.timestamp >= row.dateStart
        },
        orgId: row.organizationId,
      }))
      .value(),

    ..._.chain(validMemberOrganizations)
      .filter((row) => !row.dateStart && !row.dateEnd)
      .sortBy('createdAt')
      .reverse()
      .map((row) => ({
        when: [tsAfter(row.createdAt)],
        matches: (activity) => {
          return activity.timestamp >= row.createdAt
        },
        orgId: row.organizationId,
      }))
      .value(),
  ]

  const fallbackOrganizationId = _.chain(validMemberOrganizations)
    .filter((row) => !row.dateStart && !row.dateEnd)
    .sortBy('createdAt')
    .map((row) => row.organizationId)
    .head()
    .value()

  let fullCase: string
  if (orgCases.length > 0) {
    fullCase = `
            CASE
              ${orgCases.map(condition).join('\n')}
              ELSE ${nullableOrg(fallbackOrganizationId)}
            END
            `
  } else {
    fullCase = `${nullableOrg(fallbackOrganizationId)}`
  }

  async function insertIfMatches(activity: IDbActivityCreateData) {
    for (const condition of orgCases) {
      if (!condition.matches(activity)) {
        continue
      }

      activity.organizationId = condition.orgId
      await insertActivities([activity])
      return
    }
  }

  const qs = new QueryStream(
    formatQuery(
      `
        SELECT *
        FROM activities
        WHERE "memberId" = $(memberId)
          AND COALESCE("organizationId", cast('00000000-0000-0000-0000-000000000000' as uuid)) != COALESCE(
            ${fullCase},
            cast('00000000-0000-0000-0000-000000000000' as uuid)
          )
      `,
      { memberId },
    ),
  )
  const { processed, duration } = await qDb.stream(qs, async (stream) => {
    for await (const activity of stream) {
      await insertIfMatches(activity as unknown as IDbActivityCreateData)
    }
  })

  logger.info(`Updated ${processed} activities in ${duration}ms`)
}

export async function getAffiliationsLastCheckedAt(db: DbStore, tenantId: string) {
  try {
    const result: IAffiliationsLastCheckedAt = await db.connection().oneOrNone(
      `
      select "affiliationsLastCheckedAt"
      from tenants
      where "id" = $(tenantId);`,
      {
        tenantId,
      },
    )
    return result?.affiliationsLastCheckedAt
  } catch (err) {
    throw new Error(err)
  }
}

export async function getAllMemberIdsPaginated(
  db: DbStore,
  tenantId: string,
  limit: number,
  offset: number,
) {
  try {
    const results: IMemberId[] = await db.connection().any(
      `
      select id from members
      where "tenantId" = $(tenantId)
      order by id asc
      limit $(limit)
      offset $(offset);`,
      {
        tenantId,
        limit,
        offset,
      },
    )
    return results?.map((r) => r.id) || []
  } catch (err) {
    throw new Error(err)
  }
}

export async function getMemberIdsWithRecentRoleChanges(
  db: DbStore,
  tenantId: string,
  affiliationsLastChecked: string,
  limit: number,
  offset: number,
) {
  try {
    const results: IMemberId[] = await db.connection().any(
      `
      select distinct mo."memberId" as id from "memberOrganizations" mo
      join "members" m on mo."memberId" = m."id"
      where
            m."tenantId" = $(tenantId)
            and (
            mo."createdAt" > $(affiliationsLastChecked) or
            mo."updatedAt" > $(affiliationsLastChecked) or
            mo."deletedAt" > $(affiliationsLastChecked)
            )
      order by mo."memberId" asc
      limit $(limit)
      offset $(offset);`,

      {
        tenantId,
        affiliationsLastChecked,
        limit,
        offset,
      },
    )
    return results?.map((r) => r.id) || []
  } catch (err) {
    throw new Error(err)
  }
}

export async function updateAffiliationsLastCheckedAt(
  db: DbStore,
  tenantId: string,
): Promise<void> {
  try {
    await db.connection().any(
      `
        update tenants set "affiliationsLastCheckedAt" = now()
        where "id" = $(tenantId);
      `,
      {
        tenantId,
      },
    )
  } catch (err) {
    throw new Error(err)
  }
}

export async function getAllTenants(db: DbStore): Promise<ITenant[]> {
  let rows: ITenant[] = []
  try {
    rows = await db.connection().query(`
      select
        id as "tenantId",
        plan
      from tenants
      where "deletedAt" is null
        and plan IN ('Scale', 'Growth', 'Essential', 'Enterprise')
        and ("trialEndsAt" > NOW() or "trialEndsAt" is null);
    `)
  } catch (err) {
    this.log.error('Error while getting all tenants', err)

    throw new Error(err)
  }

  return rows
}
