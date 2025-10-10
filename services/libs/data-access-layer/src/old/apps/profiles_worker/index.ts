import _ from 'lodash'

import { getLongestDateRange } from '@crowd/common'
import { DbStore } from '@crowd/database'
import { IMemberOrganization } from '@crowd/types'

import { findMemberAffiliations } from '../../../member_segment_affiliations'
import { QueryExecutor } from '../../../queryExecutor'
import { IDbActivityCreateData } from '../data_sink_worker/repo/activity.data'

import { IAffiliationsLastCheckedAt, IMemberId } from './types'

type Condition = {
  when: string[]
  orgId: string
  matches: (activity: IDbActivityCreateData) => boolean
}

type MemberOrganizationWithOverrides = IMemberOrganization & {
  isPrimaryWorkExperience: boolean
  memberCount: number
}

type TimelineItem = {
  organizationId: string
  isPrimaryWorkExperience: boolean
  withDates?: boolean
}

export async function prepareMemberAffiliationsUpdate(qx: QueryExecutor, memberId: string) {
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

  const condition = ({ when, orgId }: Condition) => {
    return `WHEN ${when.join(' AND ')} THEN ${nullableOrg(orgId)}`
  }

  const nullableOrg = (orgId: string) => (orgId ? `cast('${orgId}' as uuid)` : 'NULL')

  const isDateInInterval = (date: Date, start: Date | null, end: Date | null) => {
    return (!start || date >= start) && (!end || date <= end)
  }

  const findOrgsWithRolesInDate = (
    date: Date,
    memberOrganizations: MemberOrganizationWithOverrides[],
  ): MemberOrganizationWithOverrides[] => {
    const p = memberOrganizations.filter((row) => {
      const dateStart = row.dateStart ? new Date(row.dateStart) : null
      const dateEnd = row.dateEnd ? new Date(row.dateEnd) : null

      return (!dateStart && !dateEnd) || isDateInInterval(date, dateStart, dateEnd)
    })

    return p
  }

  const oneDayBefore = (date: Date) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() - 1)
    return newDate
  }

  const selectPrimaryWorkExperience = (
    orgs: MemberOrganizationWithOverrides[],
  ): MemberOrganizationWithOverrides => {
    if (orgs.length === 1) {
      return orgs[0]
    }

    // first check if there's a primary work experience
    const primaryOrgs = orgs.filter((row) => row.isPrimaryWorkExperience)
    if (primaryOrgs.length > 0) {
      // favor the one with dates if there are multiple primary work experiences
      const withDates = primaryOrgs.filter((row) => !!row.dateStart)
      if (withDates.length > 0) {
        // there can be one primary work experiences with intersecting date ranges so just return the first one found
        return withDates[0]
      } else {
        // no orgs with dates were found, return the first org without dates and with primary flag
        return primaryOrgs[0]
      }
    } else {
      // no work experience was marked as primary by the user, use additional metrics to decide the primary
      // 1. favor the one with dates if there's only one
      const withDates = orgs.filter((row) => !!row.dateStart)
      if (withDates.length === 1) {
        return withDates[0]
      } else if (withDates.length > 1) {
        // only consider work experiences with dates for the next steps, if there are more than one
        // and ignore ones without dates
        orgs = withDates
      }

      // 2. get the two orgs with the most members, and return the one with the most members if there's no draw
      const sortedByMembers = orgs.sort((a, b) => b.memberCount - a.memberCount)
      if (sortedByMembers[0].memberCount > sortedByMembers[1].memberCount) {
        return sortedByMembers[0]
      }

      // 3. there's a draw, return the one with the longer date range
      return getLongestDateRange(orgs)
    }
  }

  // solves conflicts in timeranges, always decides on one org when there are overlapping ranges
  const buildTimeline = (
    memberOrganizations: MemberOrganizationWithOverrides[],
  ): TimelineItem[] => {
    const memberOrgsWithDates = memberOrganizations.filter((row) => !!row.dateStart)

    const earliestStartDate = new Date(
      Math.min(...memberOrgsWithDates.map((row) => new Date(row.dateStart).getTime())),
    )

    const now = new Date()

    // loop from earliest to latest start date, day by day
    const timeline = []
    let currentPrimaryOrg = null
    let currentStartDate = null

    for (let date = earliestStartDate; date <= now; date.setDate(date.getDate() + 1)) {
      const orgs = findOrgsWithRolesInDate(date, memberOrganizations)

      if (orgs.length === 0) {
        // means there's a gap in the timeline, close the current range if there's one, but don't open a new one
        if (currentPrimaryOrg) {
          timeline.push({
            organizationId: currentPrimaryOrg.organizationId,
            dateStart: currentStartDate.toISOString(),
            dateEnd: oneDayBefore(date).toISOString(),
          })
        }
        currentPrimaryOrg = null
        currentStartDate = null
      } else {
        const primaryOrg = selectPrimaryWorkExperience(orgs)

        if (currentPrimaryOrg == null) {
          // means there's a new range starting
          currentPrimaryOrg = primaryOrg
          currentStartDate = new Date(date)
        } else if (currentPrimaryOrg.organizationId !== primaryOrg.organizationId) {
          // we have a new primary org, we need to close the current range and open a new one
          timeline.push({
            organizationId: currentPrimaryOrg.organizationId,
            dateStart: currentStartDate.toISOString(),
            dateEnd: oneDayBefore(date).toISOString(),
          })
          currentPrimaryOrg = primaryOrg
          currentStartDate = new Date(date)
        }
      }

      // if we're at the end, close the current range
      if (currentPrimaryOrg && currentStartDate && new Date(date.getTime() + 86400000) > now) {
        timeline.push({
          organizationId: currentPrimaryOrg.organizationId,
          dateStart: currentStartDate.toISOString(),
          dateEnd: currentPrimaryOrg.dateEnd,
        })
      }
    }

    return timeline
  }

  const manualAffiliations = await findMemberAffiliations(qx, memberId)

  let memberOrganizations = await qx.select(
    `
      WITH aggs as (
      SELECT
          osa."organizationId",
          sum(osa."memberCount") AS total_count
      FROM "organizationSegmentsAgg" osa
      WHERE osa."segmentId" IN (
          SELECT id
          FROM segments
          WHERE "grandparentId" is not null
              AND "parentId" is not null
      )
      group by osa."organizationId"
      )
      SELECT
        mo.id,
        mo.title,
        mo."organizationId",
        mo."dateStart",
        mo."dateEnd",
        mo."createdAt",
        coalesce(ovr."isPrimaryWorkExperience", false) as "isPrimaryWorkExperience",
        coalesce(a.total_count, 0) as "memberCount"
      FROM "memberOrganizations" mo
      LEFT JOIN "memberOrganizationAffiliationOverrides" ovr on ovr."memberOrganizationId" = mo.id
      LEFT JOIN aggs a on a."organizationId" = mo."organizationId"
      WHERE mo."memberId" = $(memberId)
        AND mo."deletedAt" IS NULL
        AND coalesce(ovr."allowAffiliation", true) = true
      ORDER BY mo."dateStart" DESC
    `,
    { memberId },
  )

  const blacklistedTitles = ['Investor', 'Mentor', 'Board Member']

  memberOrganizations = memberOrganizations.filter(
    (row) =>
      !row.title ||
      (row.title !== null &&
        row.title !== undefined &&
        !blacklistedTitles.some((t) => row.title.toLowerCase().includes(t.toLowerCase()))),
  )

  // clean unknown dated work experiences if there is one marked as primary
  const primaryUnknownDatedWorkExperience = memberOrganizations.find(
    (row) => row.isPrimaryWorkExperience && !row.dateStart && !row.dateEnd,
  )

  if (primaryUnknownDatedWorkExperience) {
    memberOrganizations = memberOrganizations.filter(
      (row) => row.dateStart || row.id === primaryUnknownDatedWorkExperience.id,
    )
  }

  const timeline = buildTimeline(memberOrganizations)

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

    ..._.chain(timeline)
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

  return { orgCases, fullCase, fallbackOrganizationId }
}

export function figureOutNewOrgId(
  activity: IDbActivityCreateData,
  orgCases: Condition[],
  fallbackOrganizationId: string,
) {
  if (orgCases.length > 0) {
    for (const condition of orgCases) {
      if (condition.matches(activity)) {
        return condition.orgId
      }
    }
  }

  return fallbackOrganizationId || null
}

export async function getAffiliationsLastCheckedAt(db: DbStore) {
  try {
    const result: IAffiliationsLastCheckedAt = await db.connection().oneOrNone(
      `
      select "affiliationsLastCheckedAt"
      from tenants
      limit 1`,
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
        update tenants set "affiliationsLastCheckedAt" = now();
      `,
    )
  } catch (err) {
    throw new Error(err)
  }
}
