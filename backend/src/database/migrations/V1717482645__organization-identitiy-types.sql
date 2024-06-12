-- region backup

create table organization_identities_backup (
    "organizationId" uuid not null,
    platform         text,
    name             text,
    "sourceId"       text,
    url              text,
    "tenantId"       uuid not null,
    "integrationId"  uuid,
    "createdAt"      timestamptz,
    "updatedAt"      timestamptz,

    primary key ("organizationId", platform, name),
    unique (platform, name, "tenantId")
);

insert into organization_identities_backup("organizationId", platform, name, "sourceId", url, "tenantId", "integrationId", "createdAt", "updatedAt")
select "organizationId",
       platform,
       name,
       "sourceId",
       url,
       "tenantId",
       "integrationId",
       "createdAt",
       "updatedAt"
from "organizationIdentities";

-- endregion

-- region first part of schema changes

alter table organizations
    add column names text[] not null default array []::text[];

alter table "organizationIdentities"
    add column verified boolean not null default false;

alter table "organizationIdentities"
    add column type varchar(255) null;

alter table "organizationIdentities"
    add column value text null;

-- create temp primary key
alter table "organizationIdentities"
    add column temp_id uuid default uuid_generate_v4() not null;

-- organizationId, platform, name
alter table "organizationIdentities"
    drop constraint "organizationIdentities_pkey";

alter table "organizationIdentities"
    add primary key (temp_id);


alter table "organizationIdentities"
    alter column name drop not null;

-- endregion

-- region migrate organization.website
do
$$
    declare
        org      organizations%rowtype;
        verified boolean;
        platform text;
    begin
        for org in select * from organizations where website is not null and length(trim(website)) > 0
            loop
                -- determine if it's verified or not
                verified := false;
                platform := 'integration';

                if (select count(*) from "organizationIdentities" where "organizationId" = org.id) = 0 then
                    verified := true;
                elseif (select count(*)
                        from "memberOrganizations"
                        where "organizationId" = org.id
                          and source in ('enrichment', 'ui')) > 0 then
                    verified := true;
                end if;

                if 'website' = any (org."manuallyChangedFields") then
                    platform := 'custom';
                end if;

                insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                values (org.id, org."tenantId", platform, 'primary-domain', trim(org.website), verified);


                if not verified and org."lastEnrichedAt" is not null and not org."manuallyCreated" then
                    update organizations
                    set "phoneNumbers"                = null,
                        tags                          = null,
                        employees                     = null,
                        "revenueRange"                = null,
                        location                      = null,
                        "employeeCountByCountry"      = null,
                        type                          = null,
                        "geoLocation"                 = null,
                        size                          = null,
                        ticker                        = null,
                        headline                      = null,
                        profiles                      = null,
                        naics                         = null,
                        address                       = null,
                        industry                      = null,
                        founded                       = null,
                        "allSubsidiaries"             = null,
                        "alternativeNames"            = null,
                        "averageEmployeeTenure"       = null,
                        "averageTenureByLevel"        = null,
                        "averageTenureByRole"         = null,
                        "directSubsidiaries"          = null,
                        "employeeChurnRate"           = null,
                        "employeeCountByMonth"        = null,
                        "employeeGrowthRate"          = null,
                        "employeeCountByMonthByLevel" = null,
                        "employeeCountByMonthByRole"  = null,
                        "gicsSector"                  = null,
                        "grossAdditionsByMonth"       = null,
                        "grossDeparturesByMonth"      = null,
                        "ultimateParent"              = null,
                        "immediateParent"             = null
                    where id = org.id;
                end if;
            end loop;
    end
$$;

-- endregion

-- region emails

-- migrate email identities to primary-domain identities
update "organizationIdentities"
set value    = name,
    type     = 'primary-domain',
    name     = null,
    url      = null,
    verified = true
where platform = 'email';

-- endregion

-- region github

-- migrate the ones that have github url so we can extract usernames
update "organizationIdentities"
set value    = split_part(
        regexp_replace(url, '^(https?://)?', ''),
        '/',
        2
               ),
    type     = 'username',
    verified = true
where platform = 'github'
  and url ilike 'https://github.com/%';

-- these username ones also had name set that we can use
with distinct_names as (select "organizationId",
                               array_agg(distinct name) as names
                        from "organizationIdentities"
                        where platform = 'github'
                          and name is not null
                          and url ilike 'https://github.com/%'
                          and length(trim(name)) > 0
                        group by "organizationId")
update organizations o
set names = (select array(
                            select distinct unnest(array_cat(o.names, dn.names))
                    ))
from distinct_names dn
where o.id = dn."organizationId";

update "organizationIdentities"
set name = null,
    url  = null
where platform = 'github'
  and url ilike 'https://github.com/%';


-- the rest that have url are not github usernames are websites
update "organizationIdentities"
set value    = url,
    type     = 'primary-domain',
    verified = false,
    url      = null
where platform = 'github'
  and url is not null;

-- these same ones also have names that we need
with distinct_names as (select "organizationId",
                               array_agg(distinct name) as names
                        from "organizationIdentities"
                        where platform = 'github'
                          and name is not null
                          and type = 'primary-domain'
                          and length(trim(name)) > 0
                        group by "organizationId")
update organizations o
set names = (select array(
                            select distinct unnest(array_cat(o.names, dn.names))
                    ))
from distinct_names dn
where o.id = dn."organizationId";

update "organizationIdentities"
set name = null
where platform = 'github'
  and type = 'primary-domain';

-- there is but one left that has a name but no url
with distinct_names as (select "organizationId",
                               array_agg(distinct name) as names
                        from "organizationIdentities"
                        where platform = 'github'
                          and name is not null
                          and type is null
                          and url is null
                          and length(trim(name)) > 0
                        group by "organizationId")
update organizations o
set names = (select array(
                            select distinct unnest(array_cat(o.names, dn.names))
                    ))
from distinct_names dn
where o.id = dn."organizationId";

delete
from "organizationIdentities"
where platform = 'github'
  and type is null
  and name is not null;

-- endregion

-- region linkedin

update "organizationIdentities"
set value    = 'company:' || trim(name),
    name     = null,
    verified = true,
    type     = 'username',
    url      = null
where platform = 'linkedin'
  and name is not null
  and length(trim(name)) > 0
  and (
    url ilike 'linkedin.com/company/%' or
    url ilike 'https://linkedin.com/company/%' or
    url ilike 'https://www.linkedin.com/company/%' or
    url ilike 'www.linkedin.com/company/%'
    );

update "organizationIdentities"
set value    = 'school:' || trim(name),
    name     = null,
    verified = true,
    type     = 'username',
    url      = null
where platform = 'linkedin'
  and name is not null
  and length(trim(name)) > 0
  and (
    url ilike 'linkedin.com/school/%' or
    url ilike 'https://linkedin.com/school/%' or
    url ilike 'https://www.linkedin.com/school/%' or
    url ilike 'www.linkedin.com/school/%'
    );

update "organizationIdentities"
set value    = 'showcase:' || trim(name),
    name     = null,
    verified = true,
    type     = 'username',
    url      = null
where platform = 'linkedin'
  and name is not null
  and length(trim(name)) > 0
  and (
    url ilike 'linkedin.com/showcase/%' or
    url ilike 'https://linkedin.com/showcase/%' or
    url ilike 'https://www.linkedin.com/showcase/%' or
    url ilike 'www.linkedin.com/showcase/%'
    );

-- endregion

-- region enrichment

-- migrate platform=enrichment identities as they are just names
with distinct_names as (select "organizationId",
                               array_agg(distinct name) as names
                        from "organizationIdentities"
                        where platform = 'enrichment'
                          and name is not null
                          and url is null
                          and length(trim(name)) > 0
                        group by "organizationId")
update organizations o
set names = (select array(
                            select distinct unnest(array_cat(o.names, dn.names))
                    ))
from distinct_names dn
where o.id = dn."organizationId";

delete
from "organizationIdentities"
where platform = 'enrichment'
  and name is not null
  and url is null;

-- endregion

-- region twitter

-- migrate twitter
update "organizationIdentities"
set value    = name,
    type     = 'username',
    name     = null,
    url      = null,
    verified = false
where platform = 'twitter';

-- endregion

-- region custom
-- migrate custom which are just names
with distinct_names as (select "organizationId",
                               array_agg(distinct name) as names
                        from "organizationIdentities"
                        where platform = 'custom'
                          and name is not null
                          and url is null
                          and length(trim(name)) > 0
                        group by "organizationId")
update organizations o
set names = (select array(
                            select distinct unnest(array_cat(o.names, dn.names))
                    ))
from distinct_names dn
where o.id = dn."organizationId";

delete
from "organizationIdentities"
where platform = 'custom'
  and name is not null
  and url is null;

-- endregion

-- region crunchbase

update "organizationIdentities"
set type     = 'username',
    url      = null,
    value    = name,
    name     = null,
    verified = true
where platform = 'crunchbase';

-- endregion

-- region just names left

-- migrate organizationIdentities.name to organization.names

with distinct_names as (select "organizationId",
                               array_agg(distinct name) as names
                        from "organizationIdentities"
                        where name is not null
                          and length(trim(name)) > 0
                        group by "organizationId")
update organizations o
set names = (select array(
                            select distinct unnest(array_cat(o.names, dn.names))
                    ))
from distinct_names dn
where o.id = dn."organizationId";

delete
from "organizationIdentities"
where name is not null;

-- endregion

-- region move organizations.github

insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
select id, "tenantId", 'github', 'username', trim(github ->> 'handle'), false
from organizations o
where (github ->> 'handle') is not null
  and length(trim((github ->> 'handle'))) > 0
  and not exists (select 1
                  from "organizationIdentities"
                  where "organizationId" = o.id
                    and platform = 'github'
                    and type = 'username'
                    and value = (o.github ->> 'handle'));

-- endregion

-- region move organizations.twitter

insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
select id, "tenantId", 'twitter', 'username', trim(twitter ->> 'handle'), false
from organizations o
where (twitter ->> 'handle') is not null
  and length(trim((twitter ->> 'handle'))) > 0
  and not exists (select 1
                  from "organizationIdentities"
                  where "organizationId" = o.id
                    and platform = 'twitter'
                    and type = 'username'
                    and value = (o.twitter ->> 'handle'));

-- endregion

-- region move organizations.crunchbase

insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
select id, "tenantId", 'crunchbase', 'username', trim(crunchbase ->> 'handle'), false
from organizations o
where (crunchbase ->> 'handle') is not null
  and length(trim((crunchbase ->> 'handle'))) > 0
  and not exists (select 1
                  from "organizationIdentities"
                  where "organizationId" = o.id
                    and platform = 'crunchbase'
                    and type = 'username'
                    and value = (o.crunchbase ->> 'handle'));

-- endregion

-- region move organizations.linkedin
do
$$
    declare
        org record;
    begin
        for org in select *
                   from organizations
                   where linkedin is not null
                     and (linkedin ->> 'url') is not null
                     and (linkedin ->> 'handle') is not null
                     and length(trim(linkedin ->> 'url')) > 0
                     and length(trim(linkedin ->> 'handle')) > 0
            loop
                if (org.linkedin ->> 'url') ilike '%linkedin.com/company/%' then
                    if (select count(*)
                        from "organizationIdentities"
                        where "organizationId" = org.id
                          and platform = 'linkedin'
                          and type = 'username'
                          and value = 'company' || trim((org.linkedin ->> 'handle'))) = 0 then
                        insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                        values (org.id, org."tenantId", 'linkedin', 'username', 'company:' || trim((org.linkedin ->> 'handle')), false);
                    end if;
                elseif (org.linkedin ->> 'url') ilike '%linkedin.com/school/%' then
                    if (select count(*)
                        from "organizationIdentities"
                        where "organizationId" = org.id
                          and platform = 'linkedin'
                          and type = 'username'
                          and value = 'school' || trim((org.linkedin ->> 'handle'))) = 0 then
                        insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                        values (org.id, org."tenantId", 'linkedin', 'username', 'school:' || trim((org.linkedin ->> 'handle')), false);
                    end if;
                elseif (org.linkedin ->> 'url') ilike '%linkedin.com/showcase/%' then
                    if (select count(*)
                        from "organizationIdentities"
                        where "organizationId" = org.id
                          and platform = 'linkedin'
                          and type = 'username'
                          and value = 'showcase' || trim((org.linkedin ->> 'handle'))) = 0 then
                        insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                        values (org.id, org."tenantId", 'linkedin', 'username', 'showcase:' || trim((org.linkedin ->> 'handle')), false);
                    end if;
                end if;
            end loop;
    end;
$$;

-- endregion

-- region move alternativeDomains

do
$$
    declare
        org    organizations%rowtype;
        domain text;
    begin
        for org in select *
                   from organizations
                   where "alternativeDomains" is not null
                     and cardinality("alternativeDomains") > 0
            loop
                for domain in (select distinct unnest_domains
                               from (select unnest("alternativeDomains") as unnest_domains
                                     from organizations
                                     where id = org.id) as flattened_domains)
                    loop
                        if length(trim(domain)) > 0 then
                            insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                            values (org.id, org."tenantId", 'enrichment', 'alternative-domain', trim(domain), false);
                        end if;
                    end loop;
            end loop;
    end;
$$;

-- endregion

-- region move affiliatedProfiles

do
$$
    declare
        org     organizations%rowtype;
        profile text;
    begin
        for org in select *
                   from organizations
                   where "affiliatedProfiles" is not null
                     and cardinality("affiliatedProfiles") > 0
            loop
                for profile in (select distinct unnest_profiles
                                from (select unnest("affiliatedProfiles") as unnest_profiles
                                      from organizations
                                      where id = org.id) as flattened_profiles)
                    loop
                        if length(trim(profile)) > 0 then
                            insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                            values (org.id, org."tenantId", 'enrichment', 'affiliated-profile', trim(profile), false);
                        end if;
                    end loop;
            end loop;
    end;
$$;

-- endregion

-- region move weakIdentities
update organizations
set "weakIdentities" = jsonb_build_array()
where "weakIdentities" is not null
  and ("weakIdentities"::text) = '{}';

do
$$
    declare
        org   organizations%rowtype;
        e     jsonb;
        clear boolean;
    begin
        for org in select *
                   from organizations
                   where "weakIdentities" is not null
                     and jsonb_array_length("weakIdentities") > 0
            loop
                clear := false;
                for e in select value from jsonb_array_elements(org."weakIdentities") as value
                    loop
                        if length(trim((e ->> 'name')::text)) > 0 then
                            if (e ->> 'platform') = 'twitter' then
                                insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                                values (org.id, org."tenantId", 'enrichment', 'username', trim(e ->> 'name'), false);

                                clear := true;
                            end if;

                            if (e ->> 'platform') = 'linkedin' then
                                insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                                values (org.id, org."tenantId", 'enrichment', 'username', 'company:' || trim((e ->> 'name')), false);
                                clear := true;
                            end if;
                        end if;
                    end loop;
                if clear then
                    update organizations set "weakIdentities" = jsonb_build_array() where id = org.id;
                end if;
            end loop;
    end;
$$;

-- endregion

-- region duplicate cleanup within the same organization so that we can setup primary key

do
$$
    declare
        i     record;
        count int;
    begin
        for i in select "organizationId", value, type, platform, count(*) as count
                 from "organizationIdentities"
                 group by "organizationId", value, type, platform
                 having count(*) > 1
            loop
                -- try to delete the unverified duplicates first
                with row_to_delete as (select ctid
                                       from "organizationIdentities"
                                       where "organizationId" = i."organizationId"
                                         and platform = i.platform
                                         and type = i.type
                                         and value = i.value
                                         and verified = false
                                       limit i.count - 1)
                delete
                from "organizationIdentities"
                where ctid in (select ctid from row_to_delete);

                -- if we have still duplicates left then delete verified ones until there is only one left
                select count(*)
                into count
                from "organizationIdentities"
                where "organizationId" = i."organizationId"
                  and platform = i.platform
                  and type = i.type
                  and value = i.value;
                if count > 1 then
                    with row_to_delete as (select ctid
                                           from "organizationIdentities"
                                           where "organizationId" = i."organizationId"
                                             and platform = i.platform
                                             and type = i.type
                                             and value = i.value
                                             and verified = true
                                           limit count - 1)
                    delete
                    from "organizationIdentities"
                    where ctid in (select ctid from row_to_delete);
                end if;
            end loop;
    end;
$$;

-- endregion

-- region duplicate verified for the same tenant

do
$$
    declare
        row       record;
        orgid     uuid;
        duplicate record;
        count     int;
        newvalue  text;
    begin
        -- find all duplicates with verified=true for the same tenant
        for row in select "tenantId", type, platform, value, count(*) as count
                   from "organizationIdentities"
                   where verified = true
                   group by "tenantId", type, platform, value
                   having count(*) > 1
            loop
                -- we gonna rename all except one and add a merge suggestion for them
                count := 1;
                for duplicate in select ctid, *
                                 from "organizationIdentities"
                                 where "tenantId" = row."tenantId"
                                   and platform = row.platform
                                   and value = row.value
                                   and verified = true
                    loop
                        if count = 1 then
                            orgid := duplicate."organizationId";
                        else
                            newvalue := duplicate.value || ' ' || count;
                            update "organizationIdentities"
                            set value = newvalue
                            where ctid = duplicate.ctid;

                            if (select count(*)
                                from "organizationToMerge"
                                where ("organizationId" = orgid and "toMergeId" = duplicate."organizationId")
                                   or ("organizationId" = duplicate."organizationId" and "toMergeId" = orgid)) = 0 then
                                insert into "organizationToMerge"("organizationId", "toMergeId", status, "createdAt", "updatedAt")
                                values (orgid, duplicate."organizationId", 'ready', now(), now());
                            end if;
                        end if;

                        count := count + 1;
                    end loop;
            end loop;
    end;
$$;
-- endregion

-- region final schema changes

alter table "organizationIdentities"
    drop column name;

alter table "organizationIdentities"
    drop column url;

alter table "organizationIdentities"
    alter column value set not null;

alter table "organizationIdentities"
    drop constraint "organizationIdentities_pkey";

alter table "organizationIdentities"
    add primary key ("organizationId", platform, type, value);

alter table "organizationIdentities"
    drop column temp_id;

create unique index "uix_organizationIdentities_plat_val_typ_tenantId_verified"
    on "organizationIdentities" (platform, value, type, "tenantId", verified)
    where (verified = true);

alter table organizations
    rename column website to old_website;

alter table organizations
    rename column "alternativeDomains" to "old_alternativeDomains";

alter table organizations
    rename column "affiliatedProfiles" to "old_affiliatedProfiles";

alter table organizations
    rename column "weakIdentities" to "old_weakIdentities";

alter table organizations
    rename column github to old_github;

alter table organizations
    rename column twitter to old_twitter;

alter table organizations
    rename column crunchbase to old_crunchbase;

alter table organizations
    rename column linkedin to old_linkedin;

-- endregion

-- region delete organizations that don't have website and no identities

-- endregion