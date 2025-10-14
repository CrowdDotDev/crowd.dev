import map from 'lodash.map'
import pickBy from 'lodash.pickby'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { SegmentData } from '@crowd/types'

import {
  IManualAffiliationData,
  IOrganizationMemberCount,
  IWorkExperienceData,
} from '../old/apps/data_sink_worker/repo/memberAffiliation.data'
import { QueryExecutor } from '../queryExecutor'
import { buildSegmentActivityTypes, isSegmentSubproject } from '../segments'
import { prepareBulkInsert } from '../utils'

import {
  IMemberActivitySummary,
  IMemberSegmentAggregates,
  IMemberSegmentDisplayAggregates,
} from './types'

const log = getServiceChildLogger('organizations/segments')

export async function findLastSyncDate(qx: QueryExecutor, memberId: string): Promise<Date | null> {
  const result = await qx.selectOneOrNone(
    `SELECT MAX("createdAt") AS "lastSyncDate" FROM "memberSegmentsAgg" WHERE "memberId" = $(memberId)`,
    { memberId },
  )
  return result?.lastSyncDate ? new Date(result.lastSyncDate) : null
}

export async function cleanupMemberAggregates(qx: QueryExecutor, memberId: string) {
  return qx.result(
    `
      DELETE FROM "memberSegmentsAgg"
      WHERE "memberId" = $(memberId)
    `,
    {
      memberId,
    },
  )
}

export async function insertMemberSegmentAggregates(
  qx: QueryExecutor,
  data: IMemberSegmentAggregates[],
) {
  try {
    return qx.result(
      prepareBulkInsert(
        'memberSegmentsAgg',
        [
          'memberId',
          'segmentId',
          'tenantId',

          'activityCount',
          'lastActive',
          'activityTypes',
          'activeOn',
          'averageSentiment',
        ],
        data.map((d) => {
          return {
            ...d,
            tenantId: DEFAULT_TENANT_ID,
          }
        }),
        'DO NOTHING',
      ),
    )
  } catch (e) {
    log.error(e, 'Error while inserting member segments!')
    throw e
  }
}

export async function fetchManyMemberSegments(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<{ memberId: string; segments: IMemberSegmentAggregates[] }[]> {
  return qx.select(
    `
      SELECT
        "memberId",
        JSONB_AGG(msa) AS segments
      FROM "memberSegmentsAgg" msa
      WHERE "memberId" = ANY($(memberIds)::UUID[])
      GROUP BY "memberId"
    `,
    {
      memberIds,
    },
  )
}

export async function fetchAbsoluteMemberAggregates(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberActivitySummary> {
  return qx.selectOneOrNone(
    `
      SELECT SUM("activityCount") as "activityCount",
             MAX("lastActive") as "lastActive"
      FROM "memberSegmentsAgg"
      WHERE "memberId" = $(memberId);
    `,
    {
      memberId,
    },
  )
}

export async function updateMemberDisplayAggregates(
  qx: QueryExecutor,
  data: IMemberSegmentDisplayAggregates[],
): Promise<void> {
  if (data.some((item) => !item.memberId || !item.segmentId)) {
    throw new Error('Missing memberId or segmentId!')
  }

  await qx.tx(async (trx) => {
    for (const item of data) {
      // dynamically add non-falsy fields to update
      const updates = pickBy(
        {
          lastActive: item.lastActive,
          averageSentiment: item.averageSentiment,
          activityTypes: item.activityTypes,
        },
        (value) => !!value,
      )

      const setClauses = map(updates, (_value, key) => `"${key}" = $(${key})`)
      setClauses.push('"updatedAt" = now()')

      await trx.result(
        `
        UPDATE "memberSegmentsAgg"
        SET ${setClauses.join(', ')}
        WHERE "memberId" = $(memberId) AND "segmentId" = $(segmentId);
        `,
        {
          ...updates,
          memberId: item.memberId,
          segmentId: item.segmentId,
        },
      )
    }
  })
}

export async function includeMemberToSegments(
  qx: QueryExecutor,
  memberId: string,
  segmentIds: string[],
): Promise<void> {
  if (segmentIds.length === 0) {
    return
  }

  let bulkInsertMemberSegments = `INSERT INTO "memberSegments" ("memberId","segmentId", "tenantId", "createdAt") VALUES `
  const replacements = {
    memberId,
    tenantId: DEFAULT_TENANT_ID,
  }

  for (let idx = 0; idx < segmentIds.length; idx++) {
    bulkInsertMemberSegments += ` ($(memberId), $(segmentId${idx}), $(tenantId), now()) `

    replacements[`segmentId${idx}`] = segmentIds[idx]

    if (idx !== segmentIds.length - 1) {
      bulkInsertMemberSegments += `,`
    }
  }

  bulkInsertMemberSegments += ` ON CONFLICT ("memberId", "segmentId", "tenantId") DO NOTHING`

  await qx.result(bulkInsertMemberSegments, replacements)
}

export async function getMemberSegments(
  qx: QueryExecutor,
  memberId: string,
): Promise<SegmentData[]> {
  const query = `
        with member_segments as (
          select distinct on ("segmentId") "segmentId", "createdAt"
          from "memberSegments"
          where "memberId" = $(memberId)
        )
        select s.* 
        from segments s inner join member_segments ms on s.id = ms."segmentId"
        order by ms."createdAt" desc
    `

  let data = await qx.select(query, { memberId })

  data = data.map((s) => {
    return {
      ...s,
      activityTypes: null,
    }
  })

  for (const record of data) {
    if (isSegmentSubproject(record)) {
      record.activityTypes = buildSegmentActivityTypes(record)
    }
  }

  return data
}

// old memberAffiliation.repo -> findManualAffiliation
export async function findMemberManualAffiliation(
  qx: QueryExecutor,
  memberId: string,
  segmentId: string,
  timestamp: string,
): Promise<IManualAffiliationData | null> {
  const result = await qx.selectOneOrNone(
    `
      SELECT * FROM "memberSegmentAffiliations"
      WHERE "memberId" = $(memberId)
        AND "segmentId" = $(segmentId)
        AND (
          ("dateStart" <= $(timestamp) AND "dateEnd" >= $(timestamp))
          OR ("dateStart" <= $(timestamp) AND "dateEnd" IS NULL)
        )
      ORDER BY "dateStart" DESC, id
      LIMIT 1
    `,
    {
      memberId,
      segmentId,
      timestamp,
    },
  )
  return result
}

// old memberAffiliation.repo -> findWorkExperience
export async function findMemberWorkExperience(
  qx: QueryExecutor,
  memberId: string,
  timestamp: string,
): Promise<IWorkExperienceData[] | null> {
  const result = await qx.select(
    `
      SELECT
          mo.*,
          coalesce(ovr."isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
      FROM "memberOrganizations" mo
      LEFT JOIN "memberOrganizationAffiliationOverrides" ovr on ovr."memberOrganizationId" = mo."id"
      WHERE mo."memberId" = $(memberId)
        AND (
          (mo."dateStart" <= $(timestamp) AND mo."dateEnd" >= $(timestamp))
          OR (mo."dateStart" <= $(timestamp) AND mo."dateEnd" IS NULL)
        )
        AND mo."deletedAt" IS NULL
        AND coalesce(ovr."allowAffiliation", true) = true
      ORDER BY mo."dateStart" DESC, mo.id
    `,
    {
      memberId,
      timestamp,
    },
  )

  return filterOutBlacklistedTitles(result)
}

export async function findMemberCountEstimateOfOrganizations(
  qx: QueryExecutor,
  organizationIds: string[],
): Promise<IOrganizationMemberCount[] | null> {
  const result = await qx.select(
    `
      SELECT
        osa."organizationId",
        sum(osa."memberCount") AS "memberCount"
    FROM "organizationSegmentsAgg" osa
    WHERE osa."segmentId" IN (
        SELECT id
        FROM segments
        WHERE "grandparentId" is not null
            AND "parentId" is not null
    )
    and osa."organizationId" IN ($(organizationIds:csv))
    group by osa."organizationId"
    order by "memberCount" desc
    `,
    {
      organizationIds,
    },
  )

  return organizationIds
    .map((orgId) => {
      const org = result.find((r) => r.organizationId === orgId)
      return {
        organizationId: orgId,
        memberCount: org?.memberCount || 0,
      }
    })
    .sort((a, b) => b.memberCount - a.memberCount)
}

export async function findMostRecentUnknownDatedOrganizations(
  qx: QueryExecutor,
  memberId: string,
  timestamp: string,
): Promise<IWorkExperienceData[] | null> {
  const result = await qx.select(
    `
      SELECT
        mo.*,
        coalesce(ovr."isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
      FROM "memberOrganizations" mo
      LEFT JOIN "memberOrganizationAffiliationOverrides" ovr on ovr."memberOrganizationId" = mo.id
      WHERE mo."memberId" = $(memberId)
        AND mo."dateStart" IS NULL
        AND mo."dateEnd" IS NULL
        AND mo."createdAt" <= $(timestamp)
        AND mo."deletedAt" IS NULL
        AND coalesce(ovr."allowAffiliation", true) = true
      ORDER BY mo."createdAt" DESC, mo.id
    `,
    {
      memberId,
      timestamp,
    },
  )

  return filterOutBlacklistedTitles(result)
}

export async function findAllUnkownDatedOrganizations(
  qx: QueryExecutor,
  memberId: string,
): Promise<IWorkExperienceData[] | null> {
  const result = await qx.select(
    `
      SELECT
        mo.*,
        coalesce(ovr."isPrimaryWorkExperience", false) as "isPrimaryWorkExperience"
      FROM "memberOrganizations" mo
      LEFT JOIN "memberOrganizationAffiliationOverrides" ovr on ovr."memberOrganizationId" = mo.id
      WHERE mo."memberId" = $(memberId)
        AND mo."dateStart" IS NULL
        AND mo."dateEnd" IS NULL
        AND mo."deletedAt" IS NULL
        AND coalesce(ovr."allowAffiliation", true) = true
      ORDER BY mo."createdAt", mo.id
    `,
    {
      memberId,
    },
  )

  return filterOutBlacklistedTitles(result)
}

const BLACKLISTED_TITLES = ['Investor', 'Mentor', 'Board Member']
function filterOutBlacklistedTitles(experiences: IWorkExperienceData[]): IWorkExperienceData[] {
  return experiences.filter(
    (row) =>
      !row.title ||
      (row.title !== null &&
        row.title !== undefined &&
        !BLACKLISTED_TITLES.some((t) => row.title.toLowerCase().includes(t.toLowerCase()))),
  )
}
