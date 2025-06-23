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