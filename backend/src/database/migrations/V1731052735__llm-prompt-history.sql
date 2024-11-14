create table "llmPromptHistory" (
    id                    bigserial primary key,
    type                  varchar(255) not null,
    model                 text         not null,
    "entityId"            text         null,
    metadata              jsonb        null,
    prompt                text         not null,
    answer                text         not null,
    "inputTokenCount"     int          not null,
    "outputTokenCount"    int          not null,
    "responseTimeSeconds" decimal      not null,
    "createdAt"           timestamptz  not null default now()
);

create index "ix_llmPromptHistory_type_entityId" on "llmPromptHistory"("type", "entityId");
create index "ix_llmPromptHistory_entityId" on "llmPromptHistory"("entityId");
create index "ix_llmPromptHistory_type" on "llmPromptHistory"("type");