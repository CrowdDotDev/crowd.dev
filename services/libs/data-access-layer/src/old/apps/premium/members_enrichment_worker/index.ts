import { DbStore, DbTransaction } from '@crowd/database'
import { IAttributes, IMember, MemberIdentityType, OrganizationSource } from '@crowd/types'

export async function fetchMembersForEnrichment(db: DbStore): Promise<IMember[]> {
  return db.connection().query(
    `SELECT
        members."id",
        members."displayName",
        members."attributes",
        members."contributions",
        members."score",
        members."reach",
        members."tenantId",
        json_agg(json_build_object(
          'platform', mi.platform,
          'value', mi.value,
          'type', mi.type,
          'verified', mi.verified
        )) as identities,
        COUNT(activities."memberId") AS activity_count
      FROM members
      INNER JOIN tenants ON tenants.id = members."tenantId"
      INNER JOIN "memberIdentities" mi ON mi."memberId" = members.id and mi.type = '${MemberIdentityType.USERNAME}'
      INNER JOIN activities ON activities."memberId" = members.id
      WHERE tenants.plan IN ('Growth', 'Scale', 'Enterprise')
      AND (
        members."lastEnriched" < NOW() - INTERVAL '90 days'
        OR members."lastEnriched" IS NULL
      )
      AND (
        mi.platform = 'github' and mi.type = '${MemberIdentityType.EMAIL}'
      )
      AND tenants."deletedAt" IS NULL
      AND members."deletedAt" IS NULL
      GROUP BY members.id
      ORDER BY activity_count DESC
      LIMIT 10;`,
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
  memberId: string,
  tenantId: string,
  platform: string,
  values: string[],
  type: MemberIdentityType,
): Promise<string[]> {
  const results = await db.connection().any(
    `SELECT mi."memberId"
       FROM "memberIdentities" mi
       WHERE mi."memberId" <> $(memberId)
         AND mi."tenantId" = $(tenantId)
         AND mi.platform = $(platform)
         AND mi.value in ($(values:csv))
         AND mi.type = $(type)
         AND EXISTS (SELECT 1 FROM "memberSegments" ms WHERE ms."memberId" = mi."memberId")`,
    {
      memberId,
      tenantId,
      platform,
      values,
      type,
    },
  )

  return results.map((r) => r.memberId)
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
  attributes: IAttributes,
  contributions: object,
) {
  let stmtDisplayName = ''
  if (updateDisplayName) {
    stmtDisplayName = `"displayName" = $(displayName),`
  }

  return tx.query(
    `UPDATE members SET ${stmtDisplayName}
      attributes = $(attributes),
      contributions = $(contributions),
      "lastEnriched" = NOW(),
      "updatedAt" = NOW()
    WHERE id = $(memberId) AND "tenantId" = $(tenantId);`,
    {
      memberId,
      tenantId,
      attributes,
      contributions: JSON.stringify(contributions),
      displayName,
    },
  )
}
