import { IMemberAffiliation } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberAffiliations(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberAffiliation[]> {
  return qx.select(
    `
        SELECT
          msa.id,
          s.id as "segmentId",
          s.slug as "segmentSlug",
          s.name as "segmentName",
          s."parentName" as "segmentParentName",
          o.id as "organizationId",
          o."displayName" as "organizationName",
          o.logo as "organizationLogo",
          msa."dateStart" as "dateStart",
          msa."dateEnd" as "dateEnd"
        FROM "memberSegmentAffiliations" msa
               LEFT JOIN organizations o ON o.id = msa."organizationId"
               JOIN segments s ON s.id = msa."segmentId"
        WHERE msa."memberId" = $(memberId)
      `,
    {
      memberId,
    },
  )
}
