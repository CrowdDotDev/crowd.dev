import { DbConnection } from '@crowd/database'

export async function getMembersWithWrongDisplayName(
  db: DbConnection,
  { countOnly = false },
): Promise<{ rows: { id: string; displayName: string }[]; count: number }> {
  const countResult = await db.one(
    `
      select count(*) from members where "displayName" like '%@%';
      `,
  )

  if (countOnly) {
    return { rows: [], count: countResult.count }
  }

  const results = await db.any(
    `
      select "id", "displayName" from members
      where "displayName" like '%@%' limit 100;
    `,
  )

  return { rows: results, count: countResult.count }
}

export async function updateMemberDisplayName(
  db: DbConnection,
  memberId: string,
  displayName: string,
): Promise<void> {
  await db.none(
    `
      update members
      set "displayName" = $(displayName)
      where id = $(memberId);
    `,
    { memberId, displayName },
  )
}
