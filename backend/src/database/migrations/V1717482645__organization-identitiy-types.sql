-- TODO uros
-- alter table organizations
--     add column "searchSyncedAt" timestamptz null;

-- region migration script

-- region first part of schema changes

alter table organizations
    add column names text[] not null default array []::text[];

alter table "organizationIdentities"
    add column verified boolean not null default false;

alter table "organizationIdentities"
    add column type varchar(255) null;

alter table "organizationIdentities"
    add column value varchar(255) null;

-- organizationId, platform, name
alter table "organizationIdentities"
    drop constraint "organizationIdentities_pkey";

alter table "organizationIdentities"
    alter column name drop not null;

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

-- region names
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

-- endregion

-- region final schema changes

alter table "organizationIdentities"
    drop column name;

alter table "organizationIdentities"
    alter column value set not null;

create unique index "uix_organizationIdentities_plat_val_typ_tenantId_verified"
    on "organizationIdentities" (platform, value, type, "tenantId", verified)
    where (verified = true and type = 'primary-domain');

alter table "organizationIdentities"
    add primary key ("organizationId", platform, type, value);

-- endregion
    
-- endregion