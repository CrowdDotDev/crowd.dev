import { ILlmResponse, LlmModelType, LlmQueryType } from "@crowd/types";
import { QueryExecutor } from "../queryExecutor";

export async function insertPromptHistoryEntry(
    qx: QueryExecutor,
    type: LlmQueryType,
    model: LlmModelType,
    result: ILlmResponse,
    entityId?: string,
    metadata?: Record<string, unknown>,
): Promise<void> {
    await qx.result(
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

