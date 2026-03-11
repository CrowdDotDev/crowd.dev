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
  organizationId: string
  organizationName: string
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
