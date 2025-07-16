import { DbStore } from '@crowd/database'

export async function deleteOrganizationSegments(db: DbStore, organizationId: string) {
  await db.connection().query(
    `
      DELETE FROM "organizationSegments"
      WHERE "organizationId" = $1
    `,
    [organizationId],
  )

  // Delete organization segments aggregation
  await db.connection().query(
    `
      DELETE FROM "organizationSegmentsAgg"
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

export async function markOrgMergeActionsDone(db: DbStore, primaryId: string, secondaryId: string) {
  await db.connection().query(
    `
        UPDATE "mergeActions"
        SET state = $4
        WHERE type = $5
          AND "primaryId" = $1
          AND "secondaryId" = $2
          AND state != $4
    `,
    [primaryId, secondaryId, 'done', 'org'],
  )
}
