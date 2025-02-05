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
    drop column if exists old_emails,
    drop column if exists old_phonenumbers,
    drop column if exists old_twitter,
    drop column if exists old_linkedin,
    drop column if exists old_crunchbase,
    drop column if exists old_employeecountbycountry,
    drop column if exists old_geolocation,
    drop column if exists old_ticker,
    drop column if exists old_profiles,
    drop column if exists old_address,
    drop column if exists old_attributes,
    drop column if exists old_affiliatedprofiles,
    drop column if exists old_allsubsidiaries,
    drop column if exists old_alternativedomains,
    drop column if exists old_alternativenames,
    drop column if exists old_averageemployeetenure,
    drop column if exists old_averagetenurebylevel,
    drop column if exists old_averagetenurebyrole,
    drop column if exists old_directsubsidiaries,
    drop column if exists old_employeecountbymonth,
    drop column if exists old_employeecountbymonthbylevel,
    drop column if exists old_employeecountbymonthbyrole,
    drop column if exists old_gicssector,
    drop column if exists old_grossadditionsbymonth,
    drop column if exists old_grossdeparturesbymonth,
    drop column if exists old_ultimateparent,
    drop column if exists old_immediateparent,
    drop column if exists old_weakidentities,
    drop column if exists old_manuallychangedfields,
    drop column if exists old_naics,
    drop column if exists old_names;