import _ from 'lodash'

import { getLongestDateRange } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { findMemberAffiliations } from '../member_segment_affiliations'
import { QueryExecutor } from '../queryExecutor'

import type {
  MemberOrganizationAffiliationTimeline,
  MemberOrganizationWithOverrides,
  TimelineItem,
} from './types'

const logger = getServiceChildLogger('member-affiliations')

async function prepareMemberOrganizationAffiliationTimeline(
  qx: QueryExecutor,
  memberId: string,
): Promise<MemberOrganizationAffiliationTimeline> {
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
        // there can be one primary work exp with intersecting date ranges
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

  // solves conflicts in timeranges, always decides on one org when there are overlapping ranges
  const buildTimeline = (
    memberOrganizations: MemberOrganizationWithOverrides[],
  ): { timeline: TimelineItem[]; earliestStartDate: string } => {
    const memberOrgsWithDates = memberOrganizations.filter((row) => !!row.dateStart)

    if (memberOrgsWithDates.length === 0) {
      return { timeline: [], earliestStartDate: null }
    }

    const earliestStartDate = new Date(
      Math.min(...memberOrgsWithDates.map((row) => new Date(row.dateStart).getTime())),
    )

    const now = new Date()

    // loop from earliest to latest start date, day by day
    const timeline = []
    let currentPrimaryOrg = null
    let currentStartDate = null
    let gapStartDate = null

    for (let date = earliestStartDate; date <= now; date.setDate(date.getDate() + 1)) {
      const orgs = findOrgsWithRolesInDate(date, memberOrganizations)

      if (orgs.length === 0) {
        // means there's a gap in the timeline, close the current range if there's one
        if (currentPrimaryOrg) {
          timeline.push({
            organizationId: currentPrimaryOrg.organizationId,
            dateStart: currentStartDate.toISOString(),
            dateEnd: oneDayBefore(date).toISOString(),
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
            organizationId: null,
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
          })
          currentPrimaryOrg = primaryOrg
          currentStartDate = new Date(date)
        }
      }

      // if we're at the end, close the current range
      if (new Date(date.getTime() + 86400000) > now) {
        if (currentPrimaryOrg && currentStartDate) {
          timeline.push({
            organizationId: currentPrimaryOrg.organizationId,
            dateStart: currentStartDate.toISOString(),
            dateEnd: currentPrimaryOrg.dateEnd,
          })
        }

        if (gapStartDate !== null) {
          timeline.push({
            organizationId: null,
            dateStart: gapStartDate.toISOString(),
            dateEnd: now.toISOString(),
          })
        }
      }
    }

    return { timeline, earliestStartDate: earliestStartDate.toISOString() }
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

  const { timeline, earliestStartDate } = buildTimeline(memberOrganizations)

  const affiliations: TimelineItem[] = [
    ..._.chain(manualAffiliations)
      .sortBy('dateStart')
      .reverse()
      .map((row) => ({
        organizationId: row.organizationId,
        dateStart: row.dateStart,
        dateEnd: row.dateEnd,
        // we need segmentId for manual affiliations
        segmentId: row.segmentId,
      }))
      .value(),

    ..._.chain(timeline)
      .filter((row) => !!row.dateStart)
      .sortBy('dateStart')
      .reverse()
      .value(),

    ..._.chain(memberOrganizations)
      .filter((row) => !row.dateStart && !row.dateEnd)
      .sortBy('createdAt')
      .reverse()
      .value(),
  ]

  const fallbackOrganizationId =
    _.chain(memberOrganizations)
      .filter((row) => !row.dateStart && !row.dateEnd)
      .sortBy('createdAt')
      .map((row) => row.organizationId)
      .head()
      .value() ?? null

  return { affiliations, earliestStartDate, fallbackOrganizationId }
}

async function processAffiliationActivities(
  qx: QueryExecutor,
  memberId: string,
  affiliation: TimelineItem,
  batchSize = 5000,
): Promise<number> {
  let rowsUpdated
  let processed = 0

  // Build the where conditions for the subquery
  const conditions = [`"memberId" = $(memberId)`]
  const params: Record<string, unknown> = {
    memberId,
    batchSize,
    organizationId: affiliation.organizationId,
  }

  // Organization filtering
  if (affiliation.organizationId) {
    conditions.push(`"organizationId" != $(organizationId)`)
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
    const result = await qx.result(
      `
        UPDATE "activityRelations"
        SET "organizationId" = $(organizationId), "updatedAt" = CURRENT_TIMESTAMP
        WHERE "activityId" in (
          select "activityId" from "activityRelations"
          where ${whereClause}
          limit $(batchSize)
        )
        returning "activityId"
      `,
      params,
    )

    // result can be null if no activities are found/updated
    rowsUpdated = result?.length || 0
    processed += rowsUpdated
  } while (rowsUpdated === batchSize)

  logger.info({ memberId, affiliation, processed }, 'Processed activities for affiliation!')

  return processed
}

async function processFallbackActivities(
  qx: QueryExecutor,
  memberId: string,
  earliestStartDate: string,
  fallbackOrganizationId: string | null,
  batchSize = 5000,
): Promise<number> {
  let rowsUpdated
  let processed = 0

  // Build the where conditions for the subquery
  const conditions = [`"memberId" = $(memberId)`]
  const params: Record<string, unknown> = {
    memberId,
    fallbackOrganizationId,
    batchSize,
  }

  if (fallbackOrganizationId) {
    conditions.push(`"organizationId" != $(fallbackOrganizationId)`)
  } else {
    conditions.push(`"organizationId" is not null`)
  }

  if (earliestStartDate) {
    conditions.push(`"timestamp" <= $(earliestStartDate)`)
    params.earliestStartDate = earliestStartDate
  }

  const whereClause = conditions.join(' and ')

  do {
    const result = await qx.result(
      `
        UPDATE "activityRelations"
        SET "organizationId" = $(fallbackOrganizationId), "updatedAt" = CURRENT_TIMESTAMP
        WHERE "activityId" in (
          select "activityId" from "activityRelations"
          where ${whereClause}
          limit $(batchSize)
        )
        returning "activityId"
      `,
      params,
    )

    // result can be null if no activities are found/updated
    rowsUpdated = result?.length || 0
    processed += rowsUpdated
  } while (rowsUpdated === batchSize)

  logger.info({ memberId, fallbackOrganizationId, processed }, 'Processed fallback activities!')

  return processed
}

export async function refreshMemberOrganizationAffiliations(qx: QueryExecutor, memberId: string) {
  const start = performance.now()

  const { affiliations, earliestStartDate, fallbackOrganizationId } =
    await prepareMemberOrganizationAffiliationTimeline(qx, memberId)

  if (affiliations.length === 0) {
    logger.info({ memberId }, `No affiliations for member, skipping refresh!`)
    return
  }

  // process timeline in parallel
  const results = await Promise.all([
    ...affiliations.map((affiliation) => processAffiliationActivities(qx, memberId, affiliation)),
    processFallbackActivities(qx, memberId, earliestStartDate, fallbackOrganizationId),
  ])

  const duration = performance.now() - start
  const processed = results.reduce((acc, processed) => acc + processed, 0)

  logger.info({ memberId }, `Refreshed ${processed} activities in ${duration}ms`)
}
