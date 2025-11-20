import _ from 'lodash'

import { getLongestDateRange } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { findMemberAffiliations } from '../member_segment_affiliations'
import { IManualAffiliationData } from '../old/apps/data_sink_worker/repo/memberAffiliation.data'
import { QueryExecutor } from '../queryExecutor'

import type { MemberOrganizationWithOverrides, TimelineItem } from './types'

const logger = getServiceChildLogger('member-affiliations')

type AffiliationItem = MemberOrganizationWithOverrides | IManualAffiliationData

async function prepareMemberOrganizationAffiliationTimeline(
  qx: QueryExecutor,
  memberId: string,
): Promise<TimelineItem[]> {
  const isDateInInterval = (date: Date, start: Date | null, end: Date | null) => {
    return (!start || date >= start) && (!end || date <= end)
  }

  const findOrgsWithRolesInDate = (
    date: Date,
    affiliations: AffiliationItem[],
  ): AffiliationItem[] => {
    const p = affiliations.filter((row) => {
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

  const selectPrimaryWorkExperience = (orgs: AffiliationItem[]): AffiliationItem => {
    if (orgs.length === 1) {
      return orgs[0]
    }

    // manual affiliations (identified by segmentId) always take highest precedence
    const manualAffiliations = orgs.filter((row) => 'segmentId' in row && !!row.segmentId)
    if (manualAffiliations.length > 0) {
      if (manualAffiliations.length === 1) return manualAffiliations[0]
      // if multiple manual affiliations, pick the one with the longest date range
      return getLongestDateRange(manualAffiliations)
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
        // there can be one primary work exp with intersecting date ranges
        return withDates[0]
      }

      // 2. get the two orgs with the most members, and return the one with the most members if there's no draw
      // only compare member orgs (manual affiliations don't have memberCount)
      const memberOrgsOnly = orgs.filter(
        (row: AffiliationItem) => 'segmentId' in row && !!row.segmentId,
      ) as MemberOrganizationWithOverrides[]
      if (memberOrgsOnly.length >= 2) {
        const sortedByMembers = memberOrgsOnly.sort((a, b) => b.memberCount - a.memberCount)
        if (sortedByMembers[0].memberCount > sortedByMembers[1].memberCount) {
          return sortedByMembers[0]
        }
      }

      // 3. there's a draw, return the one with the longer date range
      return getLongestDateRange(orgs)
    }
  }

  // solves conflicts in timeranges, always decides on one org when there are overlapping ranges
  const buildTimeline = (
    memberOrganizations: MemberOrganizationWithOverrides[],
    manualAffiliations: IManualAffiliationData[],
    fallbackOrganizationId: string | null,
  ): TimelineItem[] => {
    const allAffiliationsWithDates = [...memberOrganizations, ...manualAffiliations].filter(
      (row) => !!row.dateStart,
    )

    const earliestStartDate =
      allAffiliationsWithDates.length > 0
        ? new Date(
            Math.min(...allAffiliationsWithDates.map((row) => new Date(row.dateStart).getTime())),
          )
        : null

    const timeline: TimelineItem[] = []
    const now = new Date()

    // default fallback start and end
    // fallback end will be updated if earliest start date exists
    const fallbackStart = new Date('1970-01-01')
    let fallbackEnd = now

    if (earliestStartDate) {
      // loop from earliest to latest start date, day by day
      let currentPrimaryOrg = null
      let currentStartDate = null
      let gapStartDate = null

      for (let date = new Date(earliestStartDate); date <= now; date.setDate(date.getDate() + 1)) {
        const orgs = findOrgsWithRolesInDate(date, [...memberOrganizations, ...manualAffiliations])

        if (orgs.length === 0) {
          // means there's a gap in the timeline, close the current range if there's one
          if (currentPrimaryOrg) {
            timeline.push({
              organizationId: currentPrimaryOrg.organizationId,
              dateStart: currentStartDate.toISOString(),
              dateEnd: oneDayBefore(date).toISOString(),
              segmentId: currentPrimaryOrg.segmentId || undefined,
            })
          }
          currentPrimaryOrg = null
          currentStartDate = null

          // start tracking gap if we haven't already
          if (gapStartDate === null) {
            gapStartDate = new Date(date)
          }
        } else {
          // if we were in a gap, close it first
          if (gapStartDate !== null) {
            timeline.push({
              organizationId: fallbackOrganizationId,
              dateStart: gapStartDate.toISOString(),
              dateEnd: oneDayBefore(date).toISOString(),
            })
            gapStartDate = null
          }

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
              segmentId: currentPrimaryOrg.segmentId || undefined,
            })
            currentPrimaryOrg = primaryOrg
            currentStartDate = new Date(date)
          } else if (currentPrimaryOrg.id !== primaryOrg.id) {
            // same org but different record, we need to keep
            currentPrimaryOrg = primaryOrg
          }
        }

        // if we're at the end, close the current range
        if (new Date(date.getTime() + 86400000) > now) {
          if (currentPrimaryOrg && currentStartDate) {
            timeline.push({
              organizationId: currentPrimaryOrg.organizationId,
              dateStart: currentStartDate.toISOString(),
              dateEnd: currentPrimaryOrg.dateEnd,
              segmentId: currentPrimaryOrg.segmentId || undefined,
            })
          }

          if (gapStartDate !== null) {
            timeline.push({
              organizationId: fallbackOrganizationId,
              dateStart: gapStartDate.toISOString(),
              dateEnd: now.toISOString(),
            })
          }
        }
      }

      // set fallback end to the day before the earliest start date to prevent overlap with
      // the dated timeline ranges above.
      fallbackEnd = oneDayBefore(earliestStartDate)
    }

    // prepend range to cover all activities before the earliest affiliation date
    // also handles edge case where fallback org is null and the timeline is empty.
    timeline.unshift({
      organizationId: fallbackOrganizationId,
      dateStart: fallbackStart.toISOString(),
      dateEnd: fallbackEnd.toISOString(),
    })

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

  let fallbackOrganizationId = primaryUnknownDatedWorkExperience?.organizationId

  if (!fallbackOrganizationId) {
    fallbackOrganizationId =
      _.chain(memberOrganizations)
        .filter((row) => !row.dateStart && !row.dateEnd)
        .sortBy('createdAt')
        .map('organizationId')
        .head()
        .value() ?? null
  }

  return buildTimeline(memberOrganizations, manualAffiliations, fallbackOrganizationId)
}

async function processAffiliationActivities(
  qx: QueryExecutor,
  memberId: string,
  affiliation: TimelineItem,
  batchSize = 5000,
): Promise<number> {
  let rowsUpdated
  let processed = 0

  const params: Record<string, unknown> = {
    memberId,
    batchSize,
    organizationId: affiliation.organizationId ?? null,
  }

  // Build the where conditions for the subquery
  const conditions = [`"memberId" = $(memberId)`]

  // Organization filtering
  if (affiliation.organizationId) {
    conditions.push(`("organizationId" is null or "organizationId" <> $(organizationId))`)
  } else {
    conditions.push(`"organizationId" is not null`)
  }

  // Date filtering
  if (affiliation.dateStart) {
    conditions.push(`"timestamp" >= $(dateStart)`)
    params.dateStart = affiliation.dateStart
  }
  if (affiliation.dateEnd) {
    conditions.push(`"timestamp" <= $(dateEnd)`)
    params.dateEnd = affiliation.dateEnd
  }

  // Segment filtering (for manual affiliations)
  if (affiliation.segmentId) {
    conditions.push(`"segmentId" = $(segmentId)`)
    params.segmentId = affiliation.segmentId
  }

  const whereClause = conditions.join(' and ')

  do {
    const rowCount = await qx.result(
      `
        UPDATE "activityRelations"
        SET "organizationId" = $(organizationId), "updatedAt" = CURRENT_TIMESTAMP
        WHERE "activityId" in (
          select "activityId" from "activityRelations"
          where ${whereClause}
          limit $(batchSize)
        )
      `,
      params,
    )

    rowsUpdated = rowCount
    processed += rowsUpdated
  } while (rowsUpdated === batchSize)

  logger.debug({ memberId, affiliation, processed }, 'Processed activities for affiliation!')

  return processed
}

export async function refreshMemberOrganizationAffiliations(qx: QueryExecutor, memberId: string) {
  const start = performance.now()

  const affiliations = await prepareMemberOrganizationAffiliationTimeline(qx, memberId)

  logger.info({ affiliations }, 'Affiliations timeline!')

  // process timeline in parallel
  const results = await Promise.all(
    affiliations.map((affiliation) => processAffiliationActivities(qx, memberId, affiliation)),
  )

  const duration = performance.now() - start
  const processed = results.reduce((acc, processed) => acc + processed, 0)

  logger.info({ memberId }, `Refreshed ${processed} activities in ${duration}ms`)
}
