alter table "memberIdentities"
    add column type         varchar(255),
    add column verified boolean not null default true;

alter table "memberIdentities"
    rename column username to value;

update "memberIdentities"
set type = 'username';
 
alter table "memberIdentities"
    alter column type set not null;

alter table "memberIdentities"
    drop constraint "memberIdentities_platform_username_tenantId_key";

drop index if exists "memberIdentities_platform_username_tenantId_key";
create unique index if not exists "uix_memberIdentities_platform_value_type_tenantId_verified" on "memberIdentities" (platform, value, type, "tenantId", verified) where verified = true;

alter table members
    rename column emails to "oldEmails";

alter table members
    rename column "weakIdentities" to "oldWeakIdentities";