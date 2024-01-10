drop index if exists "ix_activities_searchSyncedAt";
drop index if exists "ix_members_searchSyncedAt";
create index if not exists "ix_organizations_tenantId_searchSyncedAt" on organizations ("tenantId", "searchSyncedAt");