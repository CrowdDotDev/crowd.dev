import { IMemberAffiliation } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'
import { v4 as uuid } from 'uuid'

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

export async function deleteAllMemberAffiliations(qx: QueryExecutor, memberId: string) {
  await qx.result(
    `
      DELETE FROM "memberSegmentAffiliations"
      WHERE "memberId" = $(memberId)
    `,
    { memberId },
  )
}

export async function insertMultipleMemberAffiliations(
  qx: QueryExecutor,
  memberId: string,
  data: any[],
) {
  return qx.result(
    prepareBulkInsert(
      'memberSegmentAffiliations',
      ['id', 'memberId', 'segmentId', 'organizationId', 'dateStart', 'dateEnd'],
      data.map((item) => ({
        id: uuid(),
        memberId,
        segmentId: item.segmentId,
        organizationId: item.organizationId,
        dateStart: item.dateStart || null,
        dateEnd: item.dateEnd || null,
      })),
    ),
  )
}
