import { QueryExecutor } from '../queryExecutor'

export async function removeMemberToMerge(
  qx: QueryExecutor,
  memberId: string,
  toMergeId: string,
): Promise<void> {
  await qx.result(
    `
      DELETE FROM "memberToMerge"
      WHERE "memberId" = $(memberId)
        AND "toMergeId" = $(toMergeId)
    `,
    {
      memberId,
      toMergeId,
    },
  )
}

export async function addMemberNoMerge(
  qx: QueryExecutor,
  memberId: string,
  noMergeId: string,
): Promise<void> {
  await qx.result(
    `
      INSERT INTO "memberNoMerge" ("memberId", "noMergeId", "createdAt")
      VALUES ($(memberId), $(noMergeId), $(createdAt))
    `,
    {
      memberId,
      noMergeId,
      createdAt: new Date(),
    },
  )
}
