import { randomUUID } from 'crypto'

import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { ILLMSuggestionVerdict } from '@crowd/types'

class LLMSuggestionVerdictsRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async saveLLMVerdict(verdict: ILLMSuggestionVerdict): Promise<string> {
    const query = `
      insert into "llmSuggestionVerdicts" ("id", "type", "model", "primaryId", "secondaryId", "prompt", "verdict", "inputTokenCount", "outputTokenCount", "responseTimeSeconds", "createdAt")
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      returning "id";
    `
    let result: { id: string }

    try {
      result = await this.connection.one(query, [
        randomUUID(),
        verdict.type,
        verdict.model,
        verdict.primaryId,
        verdict.secondaryId,
        verdict.prompt,
        verdict.verdict,
        verdict.inputTokenCount,
        verdict.outputTokenCount,
        verdict.responseTimeSeconds,
      ])
    } catch (err) {
      this.log.error(err)
      throw new Error(err)
    }

    return result.id
  }
}

export default LLMSuggestionVerdictsRepository
