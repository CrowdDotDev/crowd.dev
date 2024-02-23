import { DbStore } from '@crowd/database'

export async function dbWeeklyGetNextEmails(db: DbStore) {
  return db.connection().query(`
      SELECT id as "tenantId", name as "tenantName"
        FROM tenants
        WHERE "deletedAt" IS NULL
        AND plan IN ('Scale', 'Growth', 'Essential')
        AND ("trialEndsAt" > NOW() OR "trialEndsAt" IS NULL);
    `)
}

export async function fetchSegments(db: DbStore, tenantId: string) {
  return db.connection().query(
    `SELECT
      s.*
    FROM segments s
    WHERE s."grandparentSlug" IS NOT NULL
      AND s."parentSlug" IS NOT NULL
      AND s."tenantId" = $1
    ORDER BY s.name;`,
    [tenantId],
  )
}

export async function fetchTenantUsers(db: DbStore, tenantId: string) {
  return db.connection().query(
    `SELECT tu."tenantId", tu."userId", u.email, u."firstName"
     FROM "tenantUsers" tu
     INNER JOIN users u ON tu."userId" = u.id
     WHERE tu."tenantId" = $1
       AND tu."status" = 'active'
       AND tu."deletedAt" IS NULL
       AND u."emailVerified" IS TRUE
       AND u."deletedAt" IS NULL;`,
    [tenantId],
  )
}

export async function fetchMostActiveMembers(
  db: DbStore,
  tenantId: string,
  dateTimeEndThisWeek: string,
  dateTimeStartThisWeek: string,
) {
  return db.connection().query(
    `select 
    count(a.id) as "activityCount",
    m."displayName" as name,
    m.attributes->'avatarUrl'->>'default' as "avatarUrl"
    from members m
    inner join activities a on m.id = a."memberId"
    where m."tenantId" = $1
    and a.timestamp between $2 and $3
    and coalesce(m.attributes->'isTeamMember'->>'default', 'false')::boolean is false
    and coalesce(m.attributes->'isBot'->>'default', 'false')::boolean is false
    group by m.id
    order by count(a.id) desc
    limit 5;`,
    [tenantId, dateTimeStartThisWeek, dateTimeEndThisWeek],
  )
}

export async function fetchMostActiveOrganizations(
  db: DbStore,
  tenantId: string,
  dateTimeStartThisWeek: string,
  dateTimeEndThisWeek: string,
) {
  return db.connection().query(
    `select count(a.id) as "activityCount",
      o."displayName" as name,
      o.logo as "avatarUrl"
    from organizations o
    inner join "memberOrganizations" mo
      on o.id = mo."organizationId"
      and mo."deletedAt" is null
    inner join members m on mo."memberId" = m.id
    inner join activities a on m.id = a."memberId"
    where m."tenantId" = $1
    and a.timestamp between $2 and $3
    and coalesce(m.attributes->'isTeamMember'->>'default', 'false')::boolean is false
    and coalesce(m.attributes->'isBot'->>'default', 'false')::boolean is false
    group by o.id
    order by count(a.id) desc
    limit 5;`,
    [tenantId, dateTimeStartThisWeek, dateTimeEndThisWeek],
  )
}

export async function fetchTopActivityTypes(
  db: DbStore,
  tenantId: string,
  dateTimeStartThisWeek: string,
  dateTimeEndThisWeek: string,
) {
  return db.connection().query(
    `select sum(count(*)) OVER () as "totalCount",
      count(*) as count,
      a.type,
      a.platform
    from activities a
    where a."tenantId" = $1
    and a.timestamp between $2 and $3
    group by a.type, a.platform
    order by count(*) desc
    limit 5;`,
    [tenantId, dateTimeStartThisWeek, dateTimeEndThisWeek],
  )
}

export async function fetchConversations(
  db: DbStore,
  tenantId: string,
  dateTimeStartThisWeek: string,
  dateTimeEndThisWeek: string,
) {
  return db.connection().query(
    `select
      c.id
    from conversations c
      join activities a on a."conversationId" = c.id
    where a."tenantId" = $1
    and a.timestamp between $2 and $3
    group by c.id
    order by count(a.id) desc
    limit 3;`,
    [tenantId, dateTimeStartThisWeek, dateTimeEndThisWeek],
  )
}
export async function fetchConversation(
  db: DbStore,
  id: string,
  tenantId: string,
  segmentId: string,
) {
  return db.connection().query(
    `SELECT * FROM conversations
          WHERE id = $1 AND "tenantId" = $2 AND "segmentId" = $3
          LIMIT 1;
        `,
    [id, tenantId, segmentId],
  )
}

export async function fetchFirstActivity(
  db: DbStore,
  id: string,
  tenantId: string,
  segmentId: string,
) {
  return db.connection().query(
    `SELECT activities.*, members."displayName" AS "memberDisplayName"
          FROM activities
          INNER JOIN members ON activities."memberId" = members.id
          WHERE activities."conversationId" = $1
          AND activities."tenantId" = $2
          AND activities."segmentId" = $3
          AND activities."parentId" IS NULL
          ORDER BY activities."timestamp" ASC, activities."createdAt" ASC
          LIMIT 1;`,
    [id, tenantId, segmentId],
  )
}

export async function fetchRemainingActivities(
  db: DbStore,
  id: string,
  tenantId: string,
  segmentId: string,
) {
  return db.connection().query(
    `SELECT * FROM activities
          WHERE "conversationId" = $1
          AND "tenantId" = $2
          AND "segmentId" = $3
          AND "parentId" IS NOT NULL
          ORDER BY "timestamp" ASC, "createdAt" ASC;`,
    [id, tenantId, segmentId],
  )
}

export async function fetchActiveIntegrations(db: DbStore, tenantId: string) {
  return db.connection().query(
    `select * from integrations i
    where i."tenantId" = $1
    and i.status = 'done'
    and i."deletedAt" is null
    limit 1;`,
    [tenantId],
  )
}
