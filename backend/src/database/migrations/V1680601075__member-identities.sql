create or replace function trigger_set_updated_at() returns trigger as
$$
begin
    new."updatedAt" = now();
    return new;
end;
$$ language 'plpgsql';

create table "memberIdentities" (
    "memberId"              uuid        not null,
    platform                text        not null,
    username                text        not null,
    "sourceId"              text        null,

    "tenantId"              uuid        not null,
    "integrationId"         uuid        null,

    "createdAt"             timestamptz not null default now(),
    "updatedAt"             timestamptz not null default now(),

    unique (platform, username, "tenantId"),
    foreign key ("memberId") references members (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    primary key ("memberId", platform)
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

alter table activities
    add column "username" text null;

update activities
set username = mi.username
from "memberIdentities" mi
where activities."memberId" = mi."memberId"
  and activities."tenantId" = mi."tenantId"
  and activities.platform = mi.platform;

alter table activities
    alter column "username" set not null;

alter table members
    alter column username drop not null;

alter table members
    rename column username to "usernameOld";

drop materialized view "memberActivityAggregatesMVs";

create materialized view "memberActivityAggregatesMVs" as
with identities as (select "memberId",
                           array_agg(platform) as identities,
                           jsonb_object_agg(platform, username) as username
                    from "memberIdentities"
                    group by "memberId")
select m.id,
       max(a."timestamp")                                                   as "lastActive",
       i.identities,
       i.username,
       count(a.id)                                                          as "activityCount",
       array_agg(
       distinct (concat(a.platform, ':', a.type))
           ) filter (
           where
           a.platform is not null
           )                                                                as "activityTypes",
       array_agg(distinct a.platform) filter (where a.platform is not null) as "activeOn",
       count(distinct a.timestamp::date)                                    as "activeDaysCount",
       round(avg(
                     case
                         when (a.sentiment ->> 'sentiment'::text) is not null
                             then (a.sentiment ->> 'sentiment'::text)::double precision
                         else null::double precision
                         end)::numeric, 2)                                  as "averageSentiment"
from members m
         inner join identities i on m.id = i."memberId"
         left join activities a on m.id = a."memberId" and a."deletedAt" is null
group by m.id, i.identities, i.username;

create unique index ix_memberactivityaggregatesmvs_memberid
    on "memberActivityAggregatesMVs" (id);