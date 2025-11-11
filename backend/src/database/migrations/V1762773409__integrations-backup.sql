create table "integrationsBackup" as
select *
from "integrations"
where 1 = 2;

alter table "integrationsBackup"
    add column "backupCreatedAt" timestamptz not null default now();

create index if not exists ix_integration_history_integration_id on "integrationsBackup" ("id");
create index if not exists ix_integration_history_history_created_at on "integrationsBackup" ("backupCreatedAt");