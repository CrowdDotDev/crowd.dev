import { DbStore } from '@crowd/database'
import { IOrganizationIdentity } from '@crowd/types'

export async function deleteOrganizationCacheLinks(db: DbStore, organizationId: string) {
  await db.connection().query(
    `
      DELETE FROM "organizationCacheLinks"
      WHERE "organizationId" = $1
    `,
    [organizationId],
  )
}

export async function deleteOrganizationSegments(db: DbStore, organizationId: string) {
  await db.connection().query(
    `
      DELETE FROM "organizationSegments"
      WHERE "organizationId" = $1
    `,
    [organizationId],
  )
}

export async function deleteOrganizationById(db: DbStore, organizationId: string) {
  await db.connection().query(
    `
      DELETE FROM organizations
      WHERE id = $1
    `,
    [organizationId],
  )
}

export async function moveActivitiesToNewOrg(
  db: DbStore,
  primaryId: string,
  secondaryId: string,
  tenantId: string,
) {
  return db.connection().result(
    `
      UPDATE "activities"
      SET "organizationId" = $1
      WHERE id IN (
        SELECT id
        FROM "activities"
        WHERE "tenantId" = $3
          AND "organizationId" = $2
        LIMIT 5000
      )
    `,
    [primaryId, secondaryId, tenantId],
  )
}

export async function markOrgMergeActionsDone(
  db: DbStore,
  primaryId: string,
  secondaryId: string,
  tenantId: string,
) {
  await db.connection().query(
    `
        UPDATE "mergeActions"
        SET state = $4
        WHERE "tenantId" = $3
          AND type = $5
          AND "primaryId" = $1
          AND "secondaryId" = $2
          AND state != $4
    `,
    [primaryId, secondaryId, tenantId, 'done', 'org'],
  )
}

export async function findOrganizationIdentities(
  db: DbStore,
  organizationId: string,
): Promise<IOrganizationIdentity[]> {
  const result = await db.connection().any(
    `
      SELECT * from "organizationIdentities"
      WHERE "organizationId" = $1
    `,
    [organizationId],
  )
  return result as IOrganizationIdentity[]
}

export async function findOrganizationCacheIdFromIdentities(
  db: DbStore,
  identities: IOrganizationIdentity[],
): Promise<string> {
  if (identities.length === 0) {
    throw new Error('No identities were sent to findOrganizationCacheIdsFromIdentities!')
  }

  let query = `SELECT id from "organizationCacheIdentities" WHERE (`
  const replacements = {}

  for (let i = 0; i < identities.length; i++) {
    query += ` "name" = $(name${i}) `
    replacements[`name${i}`] = identities[i].name
    if (i < identities.length - 1) {
      query += ' OR '
    } else {
      query += ') limit 1'
    }
  }

  const result: { id: string }[] = await db.connection().any(query, replacements)
  return result[0]?.id ?? null
}

export async function linkOrganizationToCacheId(
  db: DbStore,
  organizationId: string,
  cacheId: string,
) {
  await db.connection().query(
    `
      INSERT INTO "organizationCacheLinks" ("organizationId", "organizationCacheId")
      VALUES ($1, $2)
    `,
    [organizationId, cacheId],
  )
}
