import { DbStore } from '@crowd/database'

export async function fetchFromDatabase(db: DbStore, tenantId: string, actualdate: string) {
  return db.connection().query(
    `SELECT url, post thumbnail, platform
        FROM "eagleEyeContents"
        WHERE "tenantId" = $1
        AND "postedAt" > $2;`,
    [tenantId, actualdate],
  )
}

export async function getNextEmails(db: DbStore) {
  return db.connection().query(
    `SELECT "userId", "tenantId", settings, users.email
        FROM "tenantUsers"
        INNER JOIN users ON "tenantUsers"."userId" = users.id
        WHERE (settings -> 'eagleEye' -> 'emailDigestActive')::BOOLEAN IS TRUE
        AND (settings -> 'eagleEye' ->> 'onboarded')::BOOLEAN IS TRUE
        AND (settings -> 'eagleEye' -> 'emailDigest' ->> 'nextEmailAt')::TIMESTAMP < NOW()
        AND "tenantId" IS NOT NULL
        AND users."deletedAt" IS NULL;`,
  )
}

export async function updateNextEmailAt(
  db: DbStore,
  tenantId: string,
  userId: string,
  emailAt: string,
) {
  await db.connection().query(
    `UPDATE "tenantUsers"
     SET settings = jsonb_set(settings, '{eagleEye,emailDigest,nextEmailAt}', to_jsonb($1::TEXT), TRUE)
     WHERE "tenantId" = $2 AND "userId" = $3;`,
    [emailAt, tenantId, userId],
  )
}
