drop table if exists "activityTasks", "memberTasks", "taskAssignees", tasks;
drop table if exists "memberNotes", notes;
drop table if exists "automationExecutions", automations;

alter table integration.runs drop column if exists "microserviceId";
alter table integration.results drop column if exists "microserviceId";
alter table integration.streams drop column if exists "microserviceId";

drop table if exists public."integrationStreams";
drop table if exists public."integrationRuns";

drop table if exists microservices;

drop table if exists "recurringEmailsHistory";

drop table if exists member_organizations_backup_14_11_2024;
drop table if exists member_identities_backup_14_11_2024;
drop table if exists members_backup_14_11_2024;
drop table if exists "membersSyncRemote";
drop table if exists "memberToMergeOld";

drop table if exists 
    "old_organizationCacheLinks",
    "old_organizationCacheIdentities",
    "old_organizationCaches",
    "organizationToMergeOld",
    organization_identities_backup,
    "organizationsSyncRemote";

alter table organizations 
    drop column if exists "old_emails",
    drop column if exists "old_phoneNumbers",
    drop column if exists "old_twitter",
    drop column if exists "old_linkedin",
    drop column if exists "old_crunchbase",
    drop column if exists "old_employeeCountByCountry",
    drop column if exists "old_geoLocation",
    drop column if exists "old_ticker",
    drop column if exists "old_profiles",
    drop column if exists "old_address",
    drop column if exists "old_attributes",
    drop column if exists "old_affiliatedProfiles",
    drop column if exists "old_allSubsidiaries",
    drop column if exists "old_alternativeDomains",
    drop column if exists "old_alternativeNames",
    drop column if exists "old_averageEmployeeTenure",
    drop column if exists "old_averageTenureByLevel",
    drop column if exists "old_averageTenureByRole",
    drop column if exists "old_directSubsidiaries",
    drop column if exists "old_employeeCountByMonth",
    drop column if exists "old_employeeCountByMonthByLevel",
    drop column if exists "old_employeeCountByMonthByRole",
    drop column if exists "old_gicsSector",
    drop column if exists "old_grossAdditionsByMonth",
    drop column if exists "old_grossDeparturesByMonth",
    drop column if exists "old_ultimateParent",
    drop column if exists "old_immediateParent",
    drop column if exists "old_weakIdentities",
    drop column if exists "old_manuallyChangedFields",
    drop column if exists "old_naics",
    drop column if exists "old_names";