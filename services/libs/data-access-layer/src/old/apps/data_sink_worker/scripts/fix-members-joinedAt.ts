import { DbConnection } from '@crowd/database'

interface Member {
  id: string
  joinedAt: string
}

export async function getMembersWithJoinedAtUnixEpoch(
  db: DbConnection,
  tenantId: string,
  { countOnly = false },
): Promise<{ rows: Member[]; count: number }> {
  let countResult = { count: null }
  if (countOnly) {
    countResult = await db.one(
      `
          with members_with_multiple_activities as (
            select "memberId"
            from activities
            where "timestamp" != '1970-01-01T00:00:00.000Z'
            and "tenantId" = $(tenantId)
            group by "memberId"
            having count(*) > 1
          )
          select count(*) 
          from members m
          join members_with_multiple_activities ma on m.id = ma."memberId"
          where m."joinedAt" = '1970-01-01T00:00:00.000Z' and m."tenantId" = $(tenantId);
          `,
      { tenantId },
    )
  }

  const results = await db.any(
    `
        with members_with_multiple_activities as (
          select "memberId"
          from activities
          where "timestamp" != '1970-01-01T00:00:00.000Z'
          and "tenantId" = $(tenantId)
          group by "memberId"
          having count(*) > 1
        )
        select m.id, m."joinedAt"
        from members m
        join members_with_multiple_activities ma on m.id = ma."memberId"
        where m."joinedAt" = '1970-01-01T00:00:00.000Z'
        and m."tenantId" = $(tenantId) 
        limit 100;
        `,
    { tenantId },
  )

  return { rows: results, count: countResult.count }
}

export async function getMemberRecentActivity(
  db: DbConnection,
  tenantId: string,
  memberId: string,
): Promise<{ timestamp: string } | null> {
  return db.oneOrNone(
    `
        select "timestamp"
        from activities
        where "memberId" = $(memberId)
        and "tenantId" = $(tenantId)
        and "timestamp" != '1970-01-01T00:00:00.000Z'
        order by "timestamp" asc
        limit 1;
        `,
    { memberId, tenantId },
  )
}

export async function updateMemberJoinedAt(
  db: DbConnection,
  tenantId: string,
  memberId: string,
  joinedAt: string,
): Promise<void> {
  await db.none(
    `
      update members
      set "joinedAt" = $(joinedAt)
      where id = $(memberId)
      and "tenantId" = $(tenantId);
    `,
    { memberId, tenantId, joinedAt },
  )
}
