create table "integrationsHistory" as
select *
from "integrations"
where 1 = 2;

alter table "integrationsHistory"
    add column "historyCreatedAt" timestamptz not null default now();

create index if not exists ix_integration_history_integration_id on "integrationsHistory" ("id");

create function log_integrations_changes()
    returns trigger as
$$
begin
    insert into "integrationsHistory" select old.*;

    if (tg_op = 'DELETE') then
        return old;
    else
        return new;
    end if;
end;
$$ language plpgsql;

create trigger integrations_audit_trigger
    after update or delete
    on integrations
    for each row
execute function log_integrations_changes();