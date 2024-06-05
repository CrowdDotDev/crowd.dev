-- region first part of schema changes

alter table organizations
    add column names text[] not null default array []::text[];

alter table "organizationIdentities"
    add column verified boolean not null default false;

alter table "organizationIdentities"
    add column type varchar(255) null;

alter table "organizationIdentities"
    add column value text null;

-- organizationId, platform, name
alter table "organizationIdentities"
    drop constraint "organizationIdentities_pkey";

alter table "organizationIdentities"
    alter column name drop not null;

create unique index "uix_organizationIdentities_plat_val_typ_tenantId_verified"
    on "organizationIdentities" (platform, value, type, "tenantId", verified)
    where (verified = true and type = 'primary-domain');

-- endregion

-- region migrate organization.website
do
$$
    declare
        org      organizations%rowtype;
        verified boolean;
        platform text;
    begin
        for org in select * from organizations where website is not null
            loop
                -- determine if it's verified or not
                verified := false;
                platform := 'integrations';

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

                if verified then
                    insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                    values (org.id, org."tenantId", platform, 'primary-domain', org.website, true);
                else
                    insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                    values (org.id, org."tenantId", platform, 'primary-domain', org.website, false);

                    if org."lastEnrichedAt" is not null and not org."manuallyCreated" then
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
set value    = 'company:' || name,
    name     = null,
    verified = true,
    type     = 'username',
    url      = null
where platform = 'linkedin'
  and (
    url ilike 'linkedin.com/company/%' or
    url ilike 'https://linkedin.com/company/%' or
    url ilike 'https://www.linkedin.com/company/%' or
    url ilike 'www.linkedin.com/company/%'
    );

update "organizationIdentities"
set value    = 'school:' || name,
    name     = null,
    verified = true,
    type     = 'username',
    url      = null
where platform = 'linkedin'
  and (
    url ilike 'linkedin.com/school/%' or
    url ilike 'https://linkedin.com/school/%' or
    url ilike 'https://www.linkedin.com/school/%' or
    url ilike 'www.linkedin.com/school/%'
    );

update "organizationIdentities"
set value    = 'showcase:' || name,
    name     = null,
    verified = true,
    type     = 'username',
    url      = null
where platform = 'linkedin'
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
select id, "tenantId", 'github', 'username', github ->> 'handle', false
from organizations o
where (github ->> 'handle') is not null
  and not exists (select 1
                  from "organizationIdentities"
                  where "organizationId" = o.id
                    and platform = 'github'
                    and type = 'username'
                    and value = (o.github ->> 'handle'));

-- endregion

-- region move organizations.twitter

insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
select id, "tenantId", 'twitter', 'username', twitter ->> 'handle', false
from organizations o
where (twitter ->> 'handle') is not null
  and not exists (select 1
                  from "organizationIdentities"
                  where "organizationId" = o.id
                    and platform = 'twitter'
                    and type = 'username'
                    and value = (o.twitter ->> 'handle'));

-- endregion

-- region move organizations.crunchbase

insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
select id, "tenantId", 'crunchbase', 'username', crunchbase ->> 'handle', false
from organizations o
where (crunchbase ->> 'handle') is not null
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
            loop
                if (org.linkedin ->> 'url') ilike '%linkedin.com/company/%' then
                    if (select count(*)
                        from "organizationIdentities"
                        where "organizationId" = org.id
                          and platform = 'linkedin'
                          and type = 'username'
                          and value = 'company' || (org.linkedin ->> 'handle')) = 0 then
                        insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                        values (org.id, org."tenantId", 'linkedin', 'username', 'company:' || (org.linkedin ->> 'handle'), false);
                    end if;
                elseif (org.linkedin ->> 'url') ilike '%linkedin.com/school/%' then
                    if (select count(*)
                        from "organizationIdentities"
                        where "organizationId" = org.id
                          and platform = 'linkedin'
                          and type = 'username'
                          and value = 'school' || (org.linkedin ->> 'handle')) = 0 then
                        insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                        values (org.id, org."tenantId", 'linkedin', 'username', 'school:' || (org.linkedin ->> 'handle'), false);
                    end if;
                elseif (org.linkedin ->> 'url') ilike '%linkedin.com/showcase/%' then
                    if (select count(*)
                        from "organizationIdentities"
                        where "organizationId" = org.id
                          and platform = 'linkedin'
                          and type = 'username'
                          and value = 'showcase' || (org.linkedin ->> 'handle')) = 0 then
                        insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                        values (org.id, org."tenantId", 'linkedin', 'username', 'showcase:' || (org.linkedin ->> 'handle'), false);
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
                        insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                        values (org.id, org."tenantId", 'enrichment', 'alternative-domain', domain, false);
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
                        insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                        values (org.id, org."tenantId", 'enrichment', 'affiliated-profile', profile, false);
                    end loop;
            end loop;
    end;
$$;

-- endregion

-- region move weakIdentities

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
                        if (e ->> 'platform') = 'twitter' then
                            insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                            values (org.id, org."tenantId", 'enrichment', 'username', e ->> 'name', false);

                            clear := true;
                        end if;

                        if (e ->> 'platform') = 'linkedin' then
                            insert into "organizationIdentities"("organizationId", "tenantId", platform, type, value, verified)
                            values (org.id, org."tenantId", 'enrichment', 'username', 'company:' || (e ->> 'name'), false);
                            clear := true;
                        end if;
                    end loop;
                if clear then
                    update organizations set "weakIdentities" = jsonb_build_array() where id = org.id;
                end if;
            end loop;
    end;
$$;

-- endregion

-- region duplicate cleanup so that we can setup primary key

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

-- region final schema changes

alter table "organizationIdentities"
    drop column name;

alter table "organizationIdentities"
    drop column url;

alter table "organizationIdentities"
    alter column value set not null;

alter table "organizationIdentities"
    add primary key ("organizationId", platform, type, value);

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
