import { DbStore } from '@crowd/database'

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
