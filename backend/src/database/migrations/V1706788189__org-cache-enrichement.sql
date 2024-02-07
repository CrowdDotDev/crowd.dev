alter table "organizationCaches"
    add column if not exists "affiliatedProfiles" text[];
alter table "organizationCaches"
    add column if not exists "allSubsidiaries" text[];
alter table "organizationCaches"
    add column if not exists "alternativeDomains" text[];
alter table "organizationCaches"
    add column if not exists "alternativeNames" text[];
alter table "organizationCaches"
    add column if not exists "averageEmployeeTenure" double precision;
alter table "organizationCaches"
    add column if not exists "averageTenureByLevel" jsonb;
alter table "organizationCaches"
    add column if not exists "averageTenureByRole" jsonb;
alter table "organizationCaches"
    add column if not exists "directSubsidiaries" text[];
alter table "organizationCaches"
    add column if not exists "employeeChurnRate" jsonb;
alter table "organizationCaches"
    add column if not exists "employeeCountByMonth" jsonb;
alter table "organizationCaches"
    add column if not exists "employeeGrowthRate" jsonb;
alter table "organizationCaches"
    add column if not exists "employeeCountByMonthByLevel" jsonb;
alter table "organizationCaches"
    add column if not exists "employeeCountByMonthByRole" jsonb;
alter table "organizationCaches"
    add column if not exists "gicsSector" text;
alter table "organizationCaches"
    add column if not exists "grossAdditionsByMonth" jsonb;
alter table "organizationCaches"
    add column if not exists "grossDeparturesByMonth" jsonb;
alter table "organizationCaches"
    add column if not exists "ultimateParent" text;
alter table "organizationCaches"
    add column if not exists "immediateParent" text;