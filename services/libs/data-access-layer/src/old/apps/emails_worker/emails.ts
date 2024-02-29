import { v4 as uuid } from 'uuid'

import { DbStore } from '@crowd/database'

export async function updateRecurringEmailsHistory(
  db: DbStore,
  type: string,
  tenantId: string,
  sentAt: Date,
  emails: string[],
  weekOfYear: string | null,
) {
  await db.connection().query(
    `INSERT INTO "recurringEmailsHistory" ("id", "type", "tenantId", "emailSentAt", "emailSentTo", "weekOfYear")
        VALUES ($1, $2, $3, $4, $5, $6);`,
    [uuid(), type, tenantId, sentAt, emails, weekOfYear],
  )
}
