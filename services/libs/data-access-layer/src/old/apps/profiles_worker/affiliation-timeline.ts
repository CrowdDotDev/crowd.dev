import { getLongestDateRange } from '@crowd/common'
import { IMemberOrganization } from '@crowd/types'

import { findMemberAffiliations } from '../../../member_segment_affiliations'
import { QueryExecutor } from '../../../queryExecutor'

// todo: move to types.ts
type MemberOrganizationWithOverrides = IMemberOrganization & {
  isPrimaryWorkExperience: boolean
  memberCount: number
}

export interface MemberOrganizationTimeline {
  startDate: string
  endDate: string
  organizationId: string
}

type TimelineItem = {
  organizationId: string
  isPrimaryWorkExperience: boolean
  withDates?: boolean
}

export async function prepareMemberOrganizationAffiliationTimeline(
  qx: QueryExecutor,
  memberId: string,
): Promise<MemberOrganizationTimeline[]> {
  const isDateInInterval = (date: Date, start: Date | null, end: Date | null) => {
    return (!start || date >= start) && (!end || date <= end)
  }

  const findOrgsWithRolesInDate = (
    date: Date,
    memberOrganizations: MemberOrganizationWithOverrides[],
  ): MemberOrganizationWithOverrides[] => {
    return memberOrganizations.filter((row) => {
      const dateStart = row.dateStart ? new Date(row.dateStart) : null
      const dateEnd = row.dateEnd ? new Date(row.dateEnd) : null
      return (!dateStart && !dateEnd) || isDateInInterval(date, dateStart, dateEnd)
    })
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
        return withDates[0]
      } else {
        return primaryOrgs[0]
      }
    } else {
      // no work experience was marked as primary by the user, use additional metrics to decide the primary
      // 1. favor the one with dates if there's only one
      const withDates = orgs.filter((row) => !!row.dateStart)
      if (withDates.length === 1) {
        return withDates[0]
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

  const oneDayBefore = (date: Date) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() - 1)
    return newDate
  }

  // solves conflicts in timeranges, always decides on one org when there are overlapping ranges
  const buildTimeline = (
    memberOrganizations: MemberOrganizationWithOverrides[],
  ): MemberOrganizationTimeline[] => {
    const memberOrgsWithDates = memberOrganizations.filter((row) => !!row.dateStart)

    if (memberOrgsWithDates.length === 0) {
      // Handle case where no organizations have dates - use fallback logic
      const fallbackOrg = memberOrganizations
        .filter((row) => !row.dateStart && !row.dateEnd)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]

      if (fallbackOrg) {
        return [
          {
            startDate: fallbackOrg.createdAt,
            endDate: null,
            organizationId: fallbackOrg.organizationId,
          },
        ]
      }
      return []
    }

    const earliestStartDate = new Date(
      Math.min(...memberOrgsWithDates.map((row) => new Date(row.dateStart).getTime())),
    )

    const now = new Date()

    // loop from earliest to latest start date, day by day
    const timeline: MemberOrganizationTimeline[] = []
    let currentPrimaryOrg = null
    let currentStartDate = null

    for (let date = earliestStartDate; date <= now; date.setDate(date.getDate() + 1)) {
      const orgs = findOrgsWithRolesInDate(date, memberOrganizations)

      if (orgs.length === 0) {
        // means there's a gap in the timeline, close the current range if there's one, but don't open a new one
        if (currentPrimaryOrg) {
          timeline.push({
            organizationId: currentPrimaryOrg.organizationId,
            startDate: currentStartDate.toISOString(),
            endDate: oneDayBefore(date).toISOString(),
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
            startDate: currentStartDate.toISOString(),
            endDate: oneDayBefore(date).toISOString(),
          })
          currentPrimaryOrg = primaryOrg
          currentStartDate = new Date(date)
        }
      }

      // if we're at the end, close the current range
      if (currentPrimaryOrg && currentStartDate && new Date(date.getTime() + 86400000) > now) {
        timeline.push({
          organizationId: currentPrimaryOrg.organizationId,
          startDate: currentStartDate.toISOString(),
          endDate: currentPrimaryOrg.dateEnd,
        })
      }
    }

    return timeline
  }

  // Get manual affiliations (higher priority than memberOrganizations)
  const manualAffiliations = await findMemberAffiliations(qx, memberId)

  // Get member organizations with same logic as prepareMemberAffiliationsUpdate
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

  // Apply blacklisted titles filter (same as original)
  const blacklistedTitles = ['Investor', 'Mentor', 'Board Member']
  memberOrganizations = memberOrganizations.filter(
    (row) =>
      !row.title ||
      (row.title !== null &&
        row.title !== undefined &&
        !blacklistedTitles.some((t) => row.title.toLowerCase().includes(t.toLowerCase()))),
  )

  // Clean unknown dated work experiences if there is one marked as primary (same as original)
  const primaryUnknownDatedWorkExperience = memberOrganizations.find(
    (row) => row.isPrimaryWorkExperience && !row.dateStart && !row.dateEnd,
  )

  if (primaryUnknownDatedWorkExperience) {
    memberOrganizations = memberOrganizations.filter(
      (row) => row.dateStart || row.id === primaryUnknownDatedWorkExperience.id,
    )
  }

  // Build timeline using the same conflict resolution logic
  const timeline = buildTimeline(memberOrganizations)

  // Add manual affiliations as higher priority periods (same logic as prepareMemberAffiliationsUpdate)
  const manualAffilationPeriods: MemberOrganizationTimeline[] = manualAffiliations
    .sort((a, b) => (a.dateStart || '').localeCompare(b.dateStart || ''))
    .map((row) => ({
      startDate: row.dateStart,
      endDate: row.dateEnd,
      organizationId: row.organizationId,
    }))

  // Combine manual affiliations with timeline, manual takes precedence
  return [...manualAffilationPeriods, ...timeline]
}
