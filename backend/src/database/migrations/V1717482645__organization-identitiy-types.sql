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

-- endregion