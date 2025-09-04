import { QueryExecutor } from '../queryExecutor'

import { IDbMemberBotSuggestionInsert } from './types'

export async function insertMemberBotSuggestion(
  qx: QueryExecutor,
  suggestion: IDbMemberBotSuggestionInsert,
): Promise<void> {
  await qx.result(
    `INSERT INTO "memberBotSuggestions" ("memberId", "confidence", "createdAt", "updatedAt") 
     VALUES ($(memberId), $(confidence), now(), now())
     ON CONFLICT DO NOTHING`,
    suggestion,
  )
}

export async function insertMemberNoBot(qx: QueryExecutor, memberId: string): Promise<void> {
  await qx.result(
    `INSERT INTO "memberNoBot" ("memberId", "createdAt") VALUES ($(memberId), now())
     ON CONFLICT DO NOTHING`,
    { memberId },
  )
}
