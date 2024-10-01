import _ from 'lodash'

import { DbConnOrTx, DbStore } from '@crowd/database'
import { ITenant } from '@crowd/types'
import { findMemberAffiliations } from '../../../member_segment_affiliations'
import { pgpQx } from '../../../queryExecutor'
import { IAffiliationsLastCheckedAt, IMemberId } from './types'

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
    if (end) {
      return tsBetween(start, end)
    }
    return tsAfter(start)
  }

  type Condition = { when: string[]; then: string }

  const condition = ({ when, then }: Condition) => {
    return `WHEN ${when.join(' AND ')} THEN ${then}`
  }

  const nullableOrg = (orgId: string) => (orgId ? `'${orgId}'` : 'NULL')

  const manualAffiliations = await findMemberAffiliations(qx, memberId)

  const memberOrganizations = await qx.select(
    `
      SELECT
        "organizationId",
        "dateStart",
        "dateEnd",
        "createdAt"
      FROM "memberOrganizations"
      WHERE "memberId" = $(memberId)
        AND "deletedAt" IS NULL
      ORDER BY "dateStart" DESC
    `,
    { memberId },
  )

  const orgCases: Condition[] = [
    ..._.chain(manualAffiliations)
      .sortBy('dateStart')
      .reverse()
      .map((row) => ({
        when: [`"segmentId" = '${row.segmentId}'`, tsBetweenOrOpenEnd(row.dateStart, row.dateEnd)],
        then: nullableOrg(row.organizationId),
      }))
      .value(),

    ..._.chain(memberOrganizations)
      .filter((row) => !!row.dateStart)
      .sortBy('dateStart')
      .reverse()
      .map((row) => ({
        when: [tsBetweenOrOpenEnd(row.dateStart, row.dateEnd)],
        then: nullableOrg(row.organizationId),
      }))
      .value(),

    ..._.chain(memberOrganizations)
      .filter((row) => !row.dateStart && !row.dateEnd)
      .sortBy('createdAt')
      .reverse()
      .map((row) => ({
        when: [tsAfter(row.createdAt)],
        then: nullableOrg(row.organizationId),
      }))
      .value(),
  ]

  const fallbackOrganizationId = _.chain(memberOrganizations)
    .filter((row) => !row.dateStart && !row.dateEnd)
    .sortBy('createdAt')
    .map((row) => row.organizationId)
    .head()
    .value()

  const qdbQx = pgpQx(qDb)
  let fullCase: string
  if (orgCases.length > 0) {
    fullCase = `
            CASE
              ${orgCases.map(condition).join('\n')}
              ELSE ${nullableOrg(fallbackOrganizationId)}
            END
            `
  } else {
    fullCase = `${nullableOrg(fallbackOrganizationId)}::UUID`
  }

  const query = `
      UPDATE activities
      SET "organizationId" = ${fullCase}
      WHERE "memberId" = $(memberId)
        AND COALESCE("organizationId", '00000000-0000-0000-0000-000000000000') != COALESCE(
          ${fullCase},
          '00000000-0000-0000-0000-000000000000'
        )
    `

  await qdbQx.result(query, { memberId })
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
