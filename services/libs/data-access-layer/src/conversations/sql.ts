import { DbConnection } from '@crowd/database'
import { getClientSQL } from '@crowd/questdb'

const sql: DbConnection = getClientSQL()

export async function deleteConversation(id: string): Promise<void> {
  await Promise.all([
    sql.none('DELETE FROM activities WHERE "conversationId" = $(id);', { id }),
    sql.none('DELETE FROM conversations WHERE "id" = $(id);', { id }),
  ])
}
