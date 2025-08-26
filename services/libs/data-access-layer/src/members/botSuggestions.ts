import { QueryExecutor } from '../queryExecutor'

import { IDbBotSuggestionInsert } from './types'

export async function insertBotSuggestion(
  qx: QueryExecutor,
  suggestion: IDbBotSuggestionInsert,
): Promise<void> {
  await qx.result(
    `INSERT INTO "botSuggestions" ("memberId", "confidence", "status", "createdAt", "updatedAt") 
     VALUES ($(memberId), $(confidence), $(status), now(), now())
     ON CONFLICT DO NOTHING`,
    suggestion,
  )
}
