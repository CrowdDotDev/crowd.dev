create table "organizationCacheIdentities" (
    id      uuid not null,
    name    text not null,
    website text null,

    primary key (id, name),
    foreign key (id) references "organizationCaches" (id)
);

create index "ix_organizationCacheIdentities_name" on "organizationCacheIdentities" (name);
create index "ix_organizationCacheIdentities_website" on "organizationCacheIdentities" (website);

alter table "organizationCaches"
    rename column name to "oldName";

alter table "organizationCaches"
    rename column website to "oldWebsite";

alter table "organizationCaches"
    alter column "oldName" drop not null,
    alter column "oldWebsite" drop not null;

-- fill organizationCacheIdentities table with existing data (for caches without website because for those we need a better logic)
insert into "organizationCacheIdentities"(id, name)
select id, "oldName"
from "organizationCaches"
where "oldWebsite" is null;

create table "organizationCacheLinks" (
    "organizationCacheId" uuid not null,
    "organizationId"      uuid not null,

    primary key ("organizationCacheId", "organizationId"),
    foreign key ("organizationCacheId") references "organizationCaches" (id),
    foreign key ("organizationId") references organizations (id)
);

-- fill the new organizationCacheLinks table
-- first the ones with website match
insert into "organizationCacheLinks"("organizationCacheId", "organizationId")
select oc.id, o.id
from organizations o
         inner join "organizationCaches" oc on oc."oldWebsite" = o.website
where o.website is not null
  and not exists (select 1 from "organizationCacheLinks" where "organizationId" = o.id);

-- then the ones with name match
insert into "organizationCacheLinks"("organizationCacheId", "organizationId")
select oc.id, o.id
from organizations o
         inner join "organizationCaches" oc on oc."oldName" = o."displayName"
where o."displayName" is not null
  and not exists (select 1 from "organizationCacheLinks" where "organizationId" = o.id);

-- then the ones that are left
do
$$
    declare
        cache_id uuid;
        org      organizations%rowtype;
    begin
        for org in select *
                   from organizations o
                   where not exists (select 1 from "organizationCacheLinks" where "organizationId" = o.id)
                     and o."displayName" is not null
                     and length(trim(o."displayName")) > 0
            loop
                -- check if we already created a cache
                if org.website is not null then
                    cache_id := (select id from "organizationCaches" where "oldWebsite" = org.website limit 1);
                end if;

                if cache_id is null then
                    cache_id := (select id from "organizationCaches" where "oldName" = org."displayName" limit 1);
                end if;

                if cache_id is null then
                    -- generate id
                    cache_id := (select uuid_generate_v1());
                    -- insert organizationsCaches row
                    insert into "organizationCaches" (id, description, emails, "phoneNumbers", logo, tags, twitter, linkedin, crunchbase, employees, "revenueRange", "importHash", "createdAt", "updatedAt", location, github, "employeeCountByCountry", type, "geoLocation", size, ticker, headline, profiles, naics, address, industry, founded, "manuallyCreated", "oldName", "oldWebsite")
                    values (cache_id, org.description, org.emails, org."phoneNumbers", org.logo, org.tags, org.twitter, org.linkedin, org.crunchbase, org.employees, org."revenueRange", org."importHash", org."createdAt", org."createdAt", org.location, org.github, org."employeeCountByCountry", org.type, org."geoLocation", org.size, org.ticker, org.headline, org.profiles, org.naics, org.address, org.industry, org.founded, org."manuallyCreated", org."displayName", org.website);
                    -- insert organizationCacheIdentities row
                    insert into "organizationCacheIdentities"(id, name, website)
                    values (cache_id, org."displayName", org.website);
                end if;

                -- update create link between organizations and organizationCaches tables
                insert into "organizationCacheLinks"("organizationCacheId", "organizationId") values (cache_id, org.id);
            end loop;
    end;
$$;