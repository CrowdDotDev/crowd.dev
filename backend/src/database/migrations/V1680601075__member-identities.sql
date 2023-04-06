create or replace function trigger_set_updated_at() returns trigger as
$$
begin
    new."updatedAt" = now();
    return new;
end;
$$ language 'plpgsql';

create table "memberIdentities" (
    "memberId"      uuid        not null,
    platform        text        not null,
    username        text        not null,
    "sourceId"      text        null,

    "tenantId"      uuid        not null,
    "integrationId" uuid        null,

    "createdAt"     timestamptz not null default now(),
    "updatedAt"     timestamptz not null default now(),

    unique (platform, username, "tenantId"),
    foreign key ("memberId") references members (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    primary key ("memberId", platform, username)
);

create trigger member_identities_updated_at
    before update
    on "memberIdentities"
    for each row
execute procedure trigger_set_updated_at();

-- migrate the usernames and tenantId
insert into "memberIdentities" ("memberId", platform, username, "sourceId", "tenantId", "integrationId")
select m.id,
       keys.platform,
       m.username ->> keys.platform as username,
       null,
       m."tenantId",
       i.id
from members m
         join lateral (select jsonb_object_keys(m.username) as platform) as keys on true
         left join integrations i on m."tenantId" = i."tenantId" and keys.platform = i.platform;

-- then, update the sourceIds if they exist
update "memberIdentities" mi
set "sourceId" = m.attributes -> 'sourceId' ->> mi.platform
from members m
where mi."memberId" = m.id
  and m.attributes -> 'sourceId' ? mi.platform;
