-- drop unique constraints and unique indexes without deletedAt
alter table "memberOrganizations"
    drop constraint "memberOrganizations_memberId_organizationId_dateStart_dateE_key";
drop index if exists ix_unique_member_org_no_date_nulls;
drop index if exists ix_unique_member_org_no_end_date_nulls;

-- recreate with indexes where deletedAt is null
create unique index "ix_unique_member_org"
    on "memberOrganizations" ("memberId", "organizationId", "dateStart", "dateEnd")
    where "deletedAt" is null;

create unique index ix_unique_member_org_no_date_nulls
    on "memberOrganizations" ("memberId", "organizationId")
    where ("dateStart" is null) and ("dateEnd" is null) and ("deletedAt" is null);

create unique index ix_unique_member_org_no_end_date_nulls
    on "memberOrganizations" ("memberId", "organizationId", "dateStart")
    where ("dateEnd" is null) and ("deletedAt" is null);