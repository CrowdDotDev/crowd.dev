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
    add column "oldName"    text,
    add column "oldWebsite" text;

update "organizationCaches"
set "oldName"    = name,
    "oldWebsite" = website;
