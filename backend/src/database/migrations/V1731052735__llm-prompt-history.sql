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

-- backup members table
create table members_backup_14_11_2024 as
select *
from members
    with no data;

-- Copy all data
insert into members_backup_14_11_2024
select *
from members;

-- backup memberIdentities table
create table member_identities_backup_14_11_2024 as
select *
from "memberIdentities"
    with no data;

-- Copy all data
insert into member_identities_backup_14_11_2024
select *
from "memberIdentities";

-- backup memberOrganizations table
create table member_organizations_backup_14_11_2024 as
select *
from "memberOrganizations"
    with no data;

-- Copy all data
insert into member_organizations_backup_14_11_2024
select *
from "memberOrganizations";