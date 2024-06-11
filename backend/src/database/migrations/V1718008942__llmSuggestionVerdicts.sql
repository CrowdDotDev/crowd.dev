CREATE TABLE IF NOT EXISTS "llmSuggestionVerdicts" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "primaryId" UUID NOT NULL,
    "secondaryId" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "inputTokenCount" INTEGER NOT NULL,
    "outputTokenCount" INTEGER NOT NULL,
    "responseTimeSeconds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

create index if not exists "ix_llmSuggestionVerdicts_type_primaryId_secondaryId" on "llmSuggestionVerdicts" ("type", "primaryId", "secondaryId");