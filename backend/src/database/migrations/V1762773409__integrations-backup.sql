create table "integrationsHistory" as
select *
from "integrations"
where 1 = 2;

alter table "integrationsHistory"
    add column "historyCreatedAt" timestamptz not null default now();

create index if not exists ix_integration_history_integration_id on "integrationsHistory" ("id");
create index if not exists ix_integration_history_history_created_at on "integrationsHistory" ("historyCreatedAt");