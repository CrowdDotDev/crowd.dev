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
  const currentTime = new Date()
  await qx.result(
    `
      INSERT INTO "memberNoMerge" ("memberId", "noMergeId", "createdAt", "updatedAt")
      VALUES ($(memberId), $(noMergeId), $(createdAt), $(updatedAt))
      on conflict ("memberId", "noMergeId") do nothing
    `,
    {
      memberId,
      noMergeId,
      createdAt: currentTime,
      updatedAt: currentTime,
    },
  )
}
