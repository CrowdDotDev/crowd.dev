import _ from 'lodash'
import QueryStream from 'pg-query-stream'

import { getDefaultTenantId } from '@crowd/common'
import { DbConnOrTx, DbStore } from '@crowd/database'
import { getServiceChildLogger } from '@crowd/logging'
import { IQueue } from '@crowd/queue'

import { insertActivities } from '../../../activities'
import { findMemberAffiliations } from '../../../member_segment_affiliations'
import { formatQuery, pgpQx } from '../../../queryExecutor'
import { IDbActivityCreateData } from '../data_sink_worker/repo/activity.data'

import { IAffiliationsLastCheckedAt, IMemberId } from './types'

const logger = getServiceChildLogger('profiles_worker')
const tenantId = getDefaultTenantId()

export async function runMemberAffiliationsUpdate(
  pgDb: DbStore,
  qDb: DbConnOrTx,
  queueClient: IQueue,
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
    orgId: string
    matches: (activity: IDbActivityCreateData) => boolean
  }

  const condition = ({ when, orgId }: Condition) => {
    return `WHEN ${when.join(' AND ')} THEN ${nullableOrg(orgId)}`
  }

  const nullableOrg = (orgId: string) => (orgId ? `cast('${orgId}' as uuid)` : 'NULL')

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

    ..._.chain(memberOrganizations)
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

    ..._.chain(memberOrganizations)
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

  const fallbackOrganizationId = _.chain(memberOrganizations)
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
    activity.organizationId = null

    if (orgCases.length > 0) {
      for (const condition of orgCases) {
        if (condition.matches(activity)) {
          activity.organizationId = condition.orgId
          break
        }
      }
    }

    await insertActivities(queueClient, [activity], true)
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

export async function getAffiliationsLastCheckedAt(db: DbStore) {
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

export async function getAllMemberIdsPaginated(db: DbStore, limit: number, offset: number) {
  try {
    const results: IMemberId[] = await db.connection().any(
      `
      select id from members
      order by id asc
      limit $(limit)
      offset $(offset);`,
      {
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
            (
            mo."createdAt" > $(affiliationsLastChecked) or
            mo."updatedAt" > $(affiliationsLastChecked) or
            mo."deletedAt" > $(affiliationsLastChecked)
            )
      order by mo."memberId" asc
      limit $(limit)
      offset $(offset);`,

      {
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

export async function updateAffiliationsLastCheckedAt(db: DbStore): Promise<void> {
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
