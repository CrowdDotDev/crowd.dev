create index if not exists "ix_membersSyncRemote_memberId" on "membersSyncRemote" ("memberId");
create index if not exists "ix_membersSyncRemote_integrationId" on "membersSyncRemote" ("integrationId");
create index if not exists "ix_membersSyncRemote_syncFrom" on "membersSyncRemote" ("syncFrom");
create index if not exists "ix_membersSyncRemote_sourceId" on "membersSyncRemote" ("sourceId");
create index if not exists "ix_membersSyncRemote_status" on "membersSyncRemote" ("status");

create index if not exists "ix_organizationsSyncRemote_organizationId" on "organizationsSyncRemote" ("organizationId");
create index if not exists "ix_organizationsSyncRemote_integrationId" on "organizationsSyncRemote" ("integrationId");
create index if not exists "ix_organizationsSyncRemote_syncFrom" on "organizationsSyncRemote" ("syncFrom");
create index if not exists "ix_organizationsSyncRemote_sourceId" on "organizationsSyncRemote" ("sourceId");
create index if not exists "ix_organizationsSyncRemote_status" on "organizationsSyncRemote" ("status");