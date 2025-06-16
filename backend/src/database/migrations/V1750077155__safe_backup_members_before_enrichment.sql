-- new table for tracking member enrichments
create table "memberEnrichments" (
    "memberId"       uuid        not null,
    "lastTriedAt"    timestamptz not null default now(),
    "lastUpdatedAt"  timestamptz null,

    primary key ("memberId")
);
-- we can also drop this column since we have a new table now
alter table members
    drop column "lastEnriched";

-- backup members table
create table members_backup_16_06_2025 as
select *
from members
    with no data;

-- Copy all data
insert into members_backup_16_06_2025
select *
from members;

-- backup memberIdentities table
create table member_identities_backup_16_06_2025 as
select *
from "memberIdentities"
    with no data;

-- Copy all data
insert into member_identities_backup_16_06_2025
select *
from "memberIdentities";

-- backup memberOrganizations table
create table member_organizations_backup_16_06_2025 as
select *
from "memberOrganizations"
    with no data;

-- Copy all data
insert into member_organizations_backup_16_06_2025
select *
from "memberOrganizations";