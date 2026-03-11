import { QueryExecutor } from '../queryExecutor'

export interface IProjectAffiliationSegment {
  id: string
  slug: string
  name: string
  activityCount: number
  projectLogo: string | null
}

export interface ISegmentAffiliationWithOrg {
  id: string
  segmentId: string
  organizationId: string | null
  organizationName: string | null
  organizationLogo: string | null
  verified: boolean
  verifiedBy: string | null
  dateStart: string | null
  dateEnd: string | null
}

export interface IWorkExperienceAffiliation {
  id: string
  organizationId: string
  organizationName: string
  organizationLogo: string | null
  verified: boolean
  verifiedBy: string | null
  source: string | null
  dateStart: string | null
  dateEnd: string | null
}

/**
 * Fetch all project-level segments a member has contributions in,
 * along with contribution counts.
 */
export async function fetchMemberProjectSegments(
  qx: QueryExecutor,
  memberId: string,
): Promise<IProjectAffiliationSegment[]> {
  return qx.select(
    `
      SELECT
        s.id,
        s.slug,
        s.name,
        msa."activityCount",
        ip."logoUrl" AS "projectLogo"
      FROM "memberSegmentsAgg" msa
      JOIN segments s ON msa."segmentId" = s.id
      LEFT JOIN "insightsProjects" ip ON ip."segmentId" = s.id AND ip."deletedAt" IS NULL
      WHERE msa."memberId" = $(memberId)
        AND s."parentSlug" IS NOT NULL
        AND s."grandparentSlug" IS NULL
      ORDER BY msa."activityCount" DESC
    `,
    { memberId },
  )
}

/**
 * Fetch segment affiliations for a member with organization details.
 * These are manual per-project overrides.
 */
export async function fetchMemberSegmentAffiliationsWithOrg(
  qx: QueryExecutor,
  memberId: string,
): Promise<ISegmentAffiliationWithOrg[]> {
  return qx.select(
    `
      SELECT
        msa.id,
        msa."segmentId",
        msa."organizationId",
        o."displayName" AS "organizationName",
        o.logo AS "organizationLogo",
        msa.verified,
        msa."verifiedBy",
        msa."dateStart",
        msa."dateEnd"
      FROM "memberSegmentAffiliations" msa
      JOIN organizations o ON msa."organizationId" = o.id
      WHERE msa."memberId" = $(memberId)
    `,
    { memberId },
  )
}

/**
 * Fetch a single segment affiliation for a member + project (segment) combination.
 */
export async function fetchMemberSegmentAffiliationForProject(
  qx: QueryExecutor,
  memberId: string,
  segmentId: string,
): Promise<ISegmentAffiliationWithOrg | null> {
  const rows = await qx.select(
    `
      SELECT
        msa.id,
        msa."segmentId",
        msa."organizationId",
        o."displayName" AS "organizationName",
        o.logo AS "organizationLogo",
        msa.verified,
        msa."verifiedBy",
        msa."dateStart",
        msa."dateEnd"
      FROM "memberSegmentAffiliations" msa
      LEFT JOIN organizations o ON msa."organizationId" = o.id
      WHERE msa."memberId" = $(memberId)
        AND msa."segmentId" = $(segmentId)
    `,
    { memberId, segmentId },
  )
  return rows[0] ?? null
}

export interface ISegmentAffiliationUpdate {
  organizationId?: string
  dateStart?: string | null
  dateEnd?: string | null
  verified?: boolean
  verifiedBy?: string | null
}

/**
 * Partially update a member's segment affiliation for a given project (segment).
 * Only fields present in `data` are updated.
 */
export async function updateMemberSegmentAffiliation(
  qx: QueryExecutor,
  memberId: string,
  segmentId: string,
  data: ISegmentAffiliationUpdate,
): Promise<void> {
  const sets: string[] = []
  const params: Record<string, unknown> = { memberId, segmentId }

  if ('organizationId' in data) {
    sets.push('"organizationId" = $(organizationId)')
    params.organizationId = data.organizationId
  }
  if ('dateStart' in data) {
    sets.push('"dateStart" = $(dateStart)')
    params.dateStart = data.dateStart
  }
  if ('dateEnd' in data) {
    sets.push('"dateEnd" = $(dateEnd)')
    params.dateEnd = data.dateEnd
  }
  if ('verified' in data) {
    sets.push('"verified" = $(verified)')
    params.verified = data.verified
  }
  if ('verifiedBy' in data) {
    sets.push('"verifiedBy" = $(verifiedBy)')
    params.verifiedBy = data.verifiedBy
  }

  if (sets.length === 0) return

  await qx.result(
    `
      UPDATE "memberSegmentAffiliations"
      SET ${sets.join(', ')}
      WHERE "memberId" = $(memberId)
        AND "segmentId" = $(segmentId)
    `,
    params,
  )
}

/**
 * Fetch work experiences for a member with organization details.
 * Used as fallback affiliations when no segment affiliations exist for a project.
 */
export async function fetchMemberWorkExperienceAffiliations(
  qx: QueryExecutor,
  memberId: string,
): Promise<IWorkExperienceAffiliation[]> {
  return qx.select(
    `
      SELECT
        mo.id,
        mo."organizationId",
        o."displayName" AS "organizationName",
        o.logo AS "organizationLogo",
        mo.verified,
        mo."verifiedBy",
        mo.source,
        mo."dateStart",
        mo."dateEnd"
      FROM "memberOrganizations" mo
      JOIN organizations o ON mo."organizationId" = o.id
      WHERE mo."memberId" = $(memberId)
        AND mo."deletedAt" IS NULL
      ORDER BY mo."dateStart" DESC NULLS LAST
    `,
    { memberId },
  )
}
