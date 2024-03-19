import { v4 as uuid } from 'uuid'
import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'

export async function deleteMemberAffiliations(qx: QueryExecutor, memberId: string) {
  await qx.result(
    `
      DELETE FROM "memberSegmentAffiliations"
      WHERE "memberId" = $(memberId)
    `,
    { memberId },
  )
}

export async function findMemberAffiliations(qx: QueryExecutor, memberId: string) {
  return qx.select(
    `
      SELECT *
      FROM "memberSegmentAffiliations"
      WHERE "memberId" = $(memberId)
    `,
    { memberId },
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function insertMemberAffiliations(qx: QueryExecutor, memberId: string, data: any[]) {
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
