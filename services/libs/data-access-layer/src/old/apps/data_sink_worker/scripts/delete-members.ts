import { DbConnection } from '@crowd/database'

export async function checkIfMemberExists(db: DbConnection, memberId: string): Promise<boolean> {
  const results = await db.any(`select id from members where id = $(memberId)`, { memberId })

  if (!results.length) {
    return false
  }

  return true
}

export async function deleteMemberSegments(db: DbConnection, memberId: string): Promise<void> {
  await db.none(`delete from "memberSegments" where "memberId" = $(memberId)`, { memberId })
}

export async function deleteMember(db: DbConnection, memberId: string): Promise<void> {
  await db.none(`delete from members where id = $(memberId)`, { memberId })
}
