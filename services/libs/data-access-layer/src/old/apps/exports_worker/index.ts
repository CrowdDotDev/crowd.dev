import { DbStore } from '@crowd/database'

export async function fetchMemberAttributeSettings(db: DbStore, tenantId: string) {
  return db.connection().query(
    `SELECT id, type, "canDelete", show, label, name, options
      FROM "memberAttributeSettings" WHERE "tenantId" = $1;`,
    tenantId,
  )
}
