import { generateUUIDv4, redactNullByte } from '@crowd/common'
import { DbConnOrTx, DbStore, DbTransaction } from '@crowd/database'
import {
  IAttributes,
  IEnrichableMember,
  IMemberEnrichmentCache,
  IMemberEnrichmentSourceQueryInput,
  IMemberIdentity,
  IOrganizationIdentity,
  MemberEnrichmentSource,
  MemberIdentityType,
  OrganizationSource,
} from '@crowd/types'

export async function fetchMembersForEnrichment(
  db: DbStore,
  limit: number,
  sourceInputs: IMemberEnrichmentSourceQueryInput[],
  afterId: string,
): Promise<IEnrichableMember[]> {
  const idFilter = afterId ? ' and members.id < $2 ' : ''

  const sourceInnerQueryItems = []
  const enrichableBySqlConditions = []

  sourceInputs.forEach((input) => {
    sourceInnerQueryItems.push(
      `
      ( NOT EXISTS (
          SELECT 1 FROM "memberEnrichmentCache" mec
          WHERE mec."memberId" = members.id
          AND mec.source = '${input.source}'
          AND EXTRACT(EPOCH FROM (now() - mec."updatedAt")) < ${input.cacheObsoleteAfterSeconds})
      )`,
    )

    enrichableBySqlConditions.push(`(${input.enrichableBySql})`)
  })

  let enrichableBySqlJoined = ''

  if (enrichableBySqlConditions.length > 0) {
    enrichableBySqlJoined = `(${enrichableBySqlConditions.join(' OR ')}) `
  }

  return db.connection().query(
    `SELECT
         members."id",
         members."tenantId",
         members."displayName",
         members.attributes->'location'->>'default' as location,
         members.attributes->'websiteUrl'->>'default' as website,
         json_agg(json_build_object(
          'platform', mi.platform,
          'value', mi.value,
          'type', mi.type,
          'verified', mi.verified
        )) as identities
     FROM members
              INNER JOIN tenants ON tenants.id = members."tenantId"
              INNER JOIN "memberIdentities" mi ON mi."memberId" = members.id
     WHERE 
       ${enrichableBySqlJoined}
       AND tenants."deletedAt" IS NULL
       AND members."deletedAt" IS NULL
       AND (${sourceInnerQueryItems.join(' OR ')})
       ${idFilter}
     GROUP BY members.id
     ORDER BY members.id desc
         LIMIT $1;`,
    [limit, afterId],
  )
}

export async function fetchMembersForLFIDEnrichment(db: DbStore, limit: number, afterId: string) {
  const idFilter = afterId ? ' and members.id < $2 ' : ''

  return db.connection().query(
    `SELECT
        members."id",
        members."displayName",
        members."attributes",
        members."contributions",
        members."score",
        members."reach",
        members."tenantId",
        jsonb_agg(mi.*) as identities
      FROM members
              INNER JOIN tenants ON tenants.id = members."tenantId"
              INNER JOIN "memberIdentities" mi ON mi."memberId" = members.id
      WHERE tenants.plan IN ('Scale', 'Enterprise')
        AND (
          (mi.platform = 'github' and mi."sourceId" is not null) OR
          (mi.platform = 'linkedin' and mi."sourceId" is not null) OR
          (mi.platform = 'cvent') OR
          (mi.platform = 'tnc') OR
          (mi.type = 'email' and mi.verified)
          )
        AND tenants."deletedAt" IS NULL
        AND members."deletedAt" IS NULL
        ${idFilter}
      GROUP BY members.id
      ORDER BY members.id desc
          limit $1;`,
    [limit, afterId],
  )
}

export async function getIdentitiesExistInOtherMembers(
  db: DbStore,
  tenantId: string,
  excludeMemberId: string,
  identities: IMemberIdentity[],
): Promise<IMemberIdentity[]> {
  if (identities.length === 0) {
    throw new Error(`At least one identity must be provided!`)
  }

  let identityPartialQuery = '('
  const replacements = []
  let replacementIndex = 0

  for (let i = 0; i < identities.length; i++) {
    if (identities[i].type === MemberIdentityType.USERNAME) {
      identityPartialQuery += `(mi.verified and mi.type = '${
        MemberIdentityType.USERNAME
      }' and mi.platform = $${replacementIndex + 1} and mi."value" ilike $${replacementIndex + 2})`
      replacements[replacementIndex] = identities[i].platform
      replacements[replacementIndex + 1] = identities[i].value
      replacementIndex += 2
    } else if (identities[i].type === MemberIdentityType.EMAIL) {
      identityPartialQuery += `(mi.verified and mi.type = '${
        MemberIdentityType.EMAIL
      }' and mi."value" ilike $${replacementIndex + 1})`
      replacements[replacementIndex] = identities[i].value
      replacementIndex += 1
    }

    if (i !== identities.length - 1) {
      identityPartialQuery += ' OR '
    }
  }
  identityPartialQuery += ')'

  // push replacement for excluded member id and tenant id to the end of replacements array
  replacements.push(excludeMemberId)
  replacements.push(tenantId)

  const query = `select * from "memberIdentities" mi
  where ${identityPartialQuery}
  and mi."memberId" <> $${replacementIndex + 1}
  and mi."tenantId" = $${replacementIndex + 2};`

  return db.connection().query(query, replacements)
}

export async function getGithubIdentitiesWithoutSourceId(
  db: DbStore,
  limit: number,
  afterId: string,
  afterValue: string,
): Promise<IMemberIdentity[]> {
  if (afterId) {
    return db.connection().query(
      `select * from "memberIdentities" mi
      where mi.platform = 'github' and mi."sourceId" is null
      and (
        mi."memberId" < $1 OR
        (mi."memberId" = $1 AND mi."value" < $2)
      )
      order by mi."memberId" desc
      limit $3;`,
      [afterId, afterValue, limit],
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
      `UPDATE "memberIdentities" SET "sourceId" = $1 WHERE "memberId" = $2 AND platform = $3 AND value = $4;`,
      [sourceId, identity.memberId, identity.platform, identity.value],
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

export async function findOrganizationIdentities(
  tx: DbTransaction,
  organizationId: string,
): Promise<IOrganizationIdentity[]> {
  return tx.any(
    `select * from "organizationIdentities" where "organizationId" = $(organizationId);`,
    {
      organizationId,
    },
  )
}

export async function findOrganizationByVerifiedIdentity(
  tx: DbTransaction,
  tenantId: string,
  identity: IOrganizationIdentity,
): Promise<string | null> {
  const result = await tx.oneOrNone(
    `
    select oi."organizationId"
    from "organizationIdentities" oi
    where 
      oi."tenantId" = $(tenantId)
      and oi.platform = $(platform)
      and oi.value ilike $(value)
      and oi.type = $(type)
      and oi.verified = true
    limit 1
    `,
    { tenantId, value: identity.value, platform: identity.platform, type: identity.type },
  )

  if (result) {
    return result.organizationId
  }

  return null
}

export async function insertOrganization(
  tx: DbTransaction,
  tenantId: string,
  company: string,
  location: string,
): Promise<string> {
  const id = generateUUIDv4()
  await tx.none(
    `INSERT INTO organizations (id, "tenantId", "displayName", location, "createdAt", "updatedAt")
     VALUES ($(id), $(tenantId), $(displayName), $(location), now(), now())`,
    {
      id,
      tenantId,
      displayName: company,
      location,
    },
  )

  return id
}

export async function updateOrgIdentity(
  tx: DbTransaction,
  organizationId: string,
  tenantId: string,
  identity: IOrganizationIdentity,
): Promise<void> {
  await tx.none(
    `
    update "organizationIdentities" set
      verified = true
    where "organizationId" = $(organizationId) and "tenantId" = $(tenantId) and platform = $(platform) and value = $(value) and type = $(type)
  `,
    {
      organizationId,
      tenantId,
      platform: identity.platform,
      value: identity.value,
      type: identity.type,
    },
  )
}

export async function insertOrgIdentity(
  tx: DbTransaction,
  organizationId: string,
  tenantId: string,
  identity: IOrganizationIdentity,
) {
  await tx.query(
    `INSERT INTO "organizationIdentities" ("organizationId", "tenantId", value, type, verified, platform)
            VALUES ($(organizationId), $(tenantId), $(value), $(type), $(verified), $(platform));`,
    {
      organizationId,
      tenantId,
      value: identity.value,
      type: identity.type,
      verified: identity.verified,
      platform: identity.platform,
    },
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

export async function updateMemberAttributes(
  tx: DbTransaction,
  tenantId: string,
  memberId: string,
  attributes: IAttributes,
) {
  return tx.query(
    `UPDATE members SET
      attributes = $1,
      "updatedAt" = NOW()
    WHERE id = $2 AND "tenantId" = $3;`,
    [attributes, memberId, tenantId],
  )
}

export async function insertMemberEnrichmentCacheDb<T>(
  tx: DbConnOrTx,
  data: T,
  memberId: string,
  source: MemberEnrichmentSource,
) {
  const dataSanitized = data ? redactNullByte(JSON.stringify(data)) : null
  return tx.query(
    `INSERT INTO "memberEnrichmentCache" ("memberId", "data", "createdAt", "updatedAt", "source")
      VALUES ($1, $2, NOW(), NOW(), $3);`,
    [memberId, dataSanitized, source],
  )
}

export async function updateMemberEnrichmentCacheDb<T>(
  tx: DbConnOrTx,
  data: T,
  memberId: string,
  source: MemberEnrichmentSource,
) {
  const dataSanitized = data ? redactNullByte(JSON.stringify(data)) : null
  return tx.query(
    `UPDATE "memberEnrichmentCache"
      SET
        "updatedAt" = NOW(),
        "data" = $2
      WHERE "memberId" = $1 and source = $3;`,
    [memberId, dataSanitized, source],
  )
}

export async function touchMemberEnrichmentCacheUpdatedAtDb(
  tx: DbConnOrTx,
  memberId: string,
  source: MemberEnrichmentSource,
) {
  return tx.query(
    `UPDATE "memberEnrichmentCache"
      SET "updatedAt" = NOW()
      WHERE "memberId" = $1 and source = $2;`,
    [memberId, source],
  )
}

export async function findMemberEnrichmentCacheDb<T>(
  tx: DbConnOrTx,
  memberId: string,
  source: MemberEnrichmentSource,
): Promise<IMemberEnrichmentCache<T>> {
  const result = await tx.oneOrNone(
    `
    select *
    from "memberEnrichmentCache"
    where 
      source = $(source)
      and "memberId" = $(memberId);
    `,
    { source, memberId },
  )

  return result ?? null
}
