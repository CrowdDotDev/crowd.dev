import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { ILlmResponse, LlmModelType, LlmQueryType } from '@crowd/types'

export class LlmPromptHistoryRepository extends RepositoryBase<LlmPromptHistoryRepository> {
  public constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async insertPromptHistoryEntry(
    type: LlmQueryType,
    model: LlmModelType,
    result: ILlmResponse,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.db().none(
      `
        insert into "llmPromptHistory"(type, model, "entityId", metadata, prompt, answer, "inputTokenCount", "outputTokenCount", "responseTimeSeconds")
        values($(type), $(model), $(entityId), $(metadata), $(prompt), $(answer), $(inputTokenCount), $(outputTokenCount), $(responseTimeSeconds));
      `,
      {
        type,
        model,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ...result,
      },
    )
  }
}
