create index if not exists "ix_activityRelations_updatedAt_activityId" on public."activityRelations" ("updatedAt", "activityId");
create index if not exists "ix_members_updatedAt_id" on public.members ("updatedAt", id);
create index if not exists "ix_organizations_updatedAt_id" on public.organizations ("updatedAt", id);