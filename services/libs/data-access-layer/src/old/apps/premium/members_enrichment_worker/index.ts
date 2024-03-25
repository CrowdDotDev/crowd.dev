import { DbStore, DbTransaction } from '@crowd/database'
import { IAttributes, IMemberIdentity, OrganizationSource } from '@crowd/types'
import { generateUUIDv4 } from '@crowd/common'

export async function fetchMembersForEnrichment(db: DbStore) {
  return db.connection().query(
    `SELECT
         members."id",
         members."displayName",
         members."attributes",
         members."emails",
         members."contributions",
         members."score",
         members."reach",
         members."tenantId",
         jsonb_object_agg(mi.platform, mi.username) as username
     FROM members
              INNER JOIN tenants ON tenants.id = members."tenantId"
              INNER JOIN "memberIdentities" mi ON mi."memberId" = members.id
     WHERE tenants.plan IN ('Scale', 'Enterprise')
       AND (
         members."lastEnriched" < NOW() - INTERVAL '90 days'
             OR members."lastEnriched" IS NULL
         )
       AND (
         mi.platform = 'github'
             OR array_length(members.emails, 1) > 0
         )
       AND tenants."deletedAt" IS NULL
       AND members."deletedAt" IS NULL
     GROUP BY members.id
         LIMIT 50;`,
  )
}

export async function fetchMembersForLFIDEnrichment(db: DbStore, limit: number, offset: number) {
  return db.connection().query(
    `SELECT
        members."id",
        members."displayName",
        members."attributes",
        members."emails",
        members."contributions",
        members."score",
        members."reach",
        members."tenantId",
        jsonb_agg(mi.*) filter (where mi.platform = 'github' OR
        (mi.platform = 'linkedin' and mi."sourceId" is not null)) as identities
      FROM members
              INNER JOIN tenants ON tenants.id = members."tenantId"
              INNER JOIN "memberIdentities" mi ON mi."memberId" = members.id
      WHERE tenants.plan IN ('Scale', 'Enterprise')
        AND (
          mi.platform = 'github' OR
          (mi.platform = 'linkedin' and mi."sourceId" is not null) OR
              array_length(members.emails, 1) > 0
          )
        AND tenants."deletedAt" IS NULL
        AND members."deletedAt" IS NULL
      GROUP BY members.id
      ORDER BY members.id desc
          limit $1
          offset $2;`,
    [limit, offset],
  )
}

export async function getGithubIdentitiesWithoutSourceId(
  db: DbStore,
  limit: number,
  afterId: string,
  afterUsername: string,
): Promise<IMemberIdentity[]> {
  if (afterId) {
    return db.connection().query(
      `select * from "memberIdentities" mi
      where mi.platform = 'github' and mi."sourceId" is null
      and (
        mi."memberId" < $1 OR
        (mi."memberId" = $1 AND mi."username" < $2)
      )
      order by mi."memberId" desc
      limit $3;`,
      [afterId, afterUsername, limit],
    )
  }

  return db.connection().query(
    `select * from "memberIdentities" mi
    where mi.platform = 'github' and mi."sourceId" is null
    order by mi."memberId" desc
    limit $1;`,
    [limit],
  )
}

export async function updateIdentitySourceId(
  db: DbStore,
  identity: IMemberIdentity,
  sourceId: string,
) {
  await db
    .connection()
    .query(
      `UPDATE "memberIdentities" SET "sourceId" = $1 WHERE "memberId" = $2 AND platform = $3 AND username = $4;`,
      [sourceId, identity.memberId, identity.platform, identity.username],
    )
}

export async function updateLastEnrichedDate(
  tx: DbTransaction,
  memberId: string,
  tenantId: string,
) {
  await tx.query(
    `UPDATE members SET "lastEnriched" = NOW(), "updatedAt" = NOW() WHERE id = $1 AND "tenantId" = $2;`,
    [memberId, tenantId],
  )
}

export async function findExistingMember(
  db: DbStore,
  tenantId: string,
  platform: string,
  usernames: string[],
) {
  return db.connection().query(
    `SELECT mi."memberId"
       FROM "memberIdentities" mi
       WHERE mi."tenantId" = $1
         AND mi.platform = $2
         AND mi.username in ($3)
         AND EXISTS (SELECT 1 FROM "memberSegments" ms WHERE ms."memberId" = mi."memberId")`,
    [tenantId, platform, usernames],
  )
}

export async function addMemberToMerge(tx: DbTransaction, memberId: string, toMergeId: string) {
  await tx.query(
    `INSERT INTO "memberToMerge" ("memberId", "toMergeId", similarity)
                VALUES ($1, $2, $3);"`,
    [memberId, toMergeId, 0.9],
  )
}

export async function findExistingOrganization(db: DbStore, orgName: string, tenantId: string) {
  return await db.connection().query(
    `SELECT id FROM organizations
            WHERE "displayName" ILIKE $1
            AND "tenantId" = $2
            AND "deletedAt" IS NULL;`,
    [orgName, tenantId],
  )
}

export async function upsertOrg(
  tx: DbTransaction,
  tenantId: string,
  company: string,
  companyUrl: string,
  companyLinkedInUrl: string,
  location: string,
) {
  return tx.query(
    `INSERT INTO organizations (id, "tenantId", "displayName", website, linkedin, location, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7) ON CONFLICT (website,"tenantId")
       WHERE website IS NOT NULL DO
      UPDATE SET "displayName" = EXCLUDED."displayName"
        RETURNING id;`,
    [
      generateUUIDv4(),
      tenantId,
      company,
      companyUrl,
      companyLinkedInUrl
        ? {
            url: companyLinkedInUrl,
            handle: companyLinkedInUrl.split('/').pop(),
          }
        : null,
      location,
      new Date(Date.now()),
    ],
  )
}

export async function upsertOrganization(
  tx: DbTransaction,
  orgId: string,
  tenantId: string,
  displayName: string,
  website: string,
  linkedin: string,
  location: string,
) {
  return await tx.query(
    `INSERT INTO organizations (id, "tenantId", "displayName", website, linkedin, location, "createdAt", "updatedAt")
              VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
              ON CONFLICT (website, "tenantId")
                WHERE website IS NOT NULL
                DO UPDATE SET
                  linkedin = EXCLUDED.linkedin,
                  location = EXCLUDED.location,
                  "updatedAt" = NOW()
              RETURNING id;`,
    [
      orgId,
      tenantId,
      displayName,
      website,
      linkedin
        ? {
            url: linkedin,
            handle: linkedin.split('/').pop(),
          }
        : null,
      location,
    ],
  )
}

export async function insertOrgIdentity(
  tx: DbTransaction,
  orgId: string,
  tenantId: string,
  name: string,
  platform: string,
  url: string,
) {
  await tx.query(
    `INSERT INTO "organizationIdentities" ("organizationId", "tenantId", name, platform, url)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT ON CONSTRAINT "organizationIdentities_platform_name_tenantId_key"
            DO UPDATE SET name = EXCLUDED.name, url = EXCLUDED.url;`,
    [orgId, tenantId, name, platform, url],
  )
}

export async function deleteMemberOrg(tx: DbTransaction, memberId: string, orgId: string) {
  await tx.query(
    `UPDATE "memberOrganizations"
      SET "deletedAt" = NOW()
      WHERE "memberId" = $1
      AND "organizationId" = $2
      AND "dateStart" IS NULL
      AND "dateEnd" IS NULL
    `,
    [memberId, orgId],
  )
}

export async function findMemberOrgs(db: DbStore, memberId: string, orgId: string) {
  return await db.connection().query(
    `SELECT COUNT(*) AS count FROM "memberOrganizations"
                WHERE "memberId" = $1
                AND "organizationId" = $2
                AND "dateStart" IS NOT NULL
                AND "deletedAt" IS NULL
              `,
    [memberId, orgId],
  )
}

export async function insertWorkExperience(
  tx: DbTransaction,
  memberId: string,
  orgId: string,
  title: string,
  dateStart: string,
  dateEnd: string,
  source: OrganizationSource,
) {
  let conflictCondition = `("memberId", "organizationId", "dateStart", "dateEnd")`
  if (!dateEnd) {
    conflictCondition = `("memberId", "organizationId", "dateStart") WHERE "dateEnd" IS NULL`
  }
  if (!dateStart) {
    conflictCondition = `("memberId", "organizationId") WHERE "dateStart" IS NULL AND "dateEnd" IS NULL`
  }

  const onConflict =
    source === OrganizationSource.UI
      ? `ON CONFLICT ${conflictCondition} DO UPDATE SET "title" = $3, "dateStart" = $4, "dateEnd" = $5, "deletedAt" = NULL, "source" = $6`
      : 'ON CONFLICT DO NOTHING'

  await tx.query(
    `
              INSERT INTO "memberOrganizations" ("memberId", "organizationId", "createdAt", "updatedAt", "title", "dateStart", "dateEnd", "source")
              VALUES ($1, $2, NOW(), NOW(), $3, $4, $5, $6)
              ${onConflict};
            `,
    [memberId, orgId, title, dateStart, dateEnd, source],
  )
}

export async function updateMember(
  tx: DbTransaction,
  tenantId: string,
  memberId: string,
  displayName: string,
  updateDisplayName: boolean,
  emails: string[],
  attributes: IAttributes,
  contributions: object,
) {
  let stmtDisplayName = ''
  if (updateDisplayName) {
    stmtDisplayName = `"displayName" = $1,`
  }

  return tx.query(
    `UPDATE members SET ${stmtDisplayName}
      emails = $2,
      attributes = $3,
      contributions = $4,
      "lastEnriched" = NOW(),
      "updatedAt" = NOW()
    WHERE id = $5 AND "tenantId" = $6;`,
    [displayName, emails, attributes, JSON.stringify(contributions), memberId, tenantId],
  )
}
