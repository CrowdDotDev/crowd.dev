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
create index "ix_llmPromptHistory_secondaryId" on "llmPromptHistory" (((metadata->>'secondaryId')::uuid)) where type in ('organization_merge_suggestion', 'member_merge_suggestion');

insert into "llmPromptHistory"(type, model, "entityId", metadata, prompt, answer, "inputTokenCount", "outputTokenCount", "responseTimeSeconds")
select 'organization_merge_suggestion',
       model,
       "primaryId",
       json_build_object(
               'secondaryId', "secondaryId"
       ),
       prompt,
       verdict,
       "inputTokenCount",
       "outputTokenCount",
       "responseTimeSeconds"
from "llmSuggestionVerdicts"
where type = 'organization';

delete from "llmSuggestionVerdicts" where type = 'organization';

insert into "llmPromptHistory"(type, model, "entityId", metadata, prompt, answer, "inputTokenCount", "outputTokenCount", "responseTimeSeconds")
select 'member_merge_suggestion',
       model,
       "primaryId",
       json_build_object(
               'secondaryId', "secondaryId"
       ),
       prompt,
       verdict,
       "inputTokenCount",
       "outputTokenCount",
       "responseTimeSeconds"
from "llmSuggestionVerdicts"
where type = 'member';

delete from "llmSuggestionVerdicts" where type = 'member';

do
$$
    begin
        if (select count(*) from "llmSuggestionVerdicts") > 0 then
            raise exception 'Table llmSuggestionVerdicts is not empty - contains % rows', (select count(*) from "llmSuggestionVerdicts");
        end if;
        drop table "llmSuggestionVerdicts";
    end
$$;