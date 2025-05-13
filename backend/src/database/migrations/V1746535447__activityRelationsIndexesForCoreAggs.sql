-- Indexes to optimize queries for member and organization activity core aggregates
create index concurrently if not exists "ix_activityRelations_memberId_segmentId_include"
on "activityRelations" ("memberId", "segmentId")
include ("platform", "activityId");

create index concurrently if not exists "ix_activityRelations_organizationId_segmentId_include"
on "activityRelations" ("organizationId", "segmentId")
include ("platform", "activityId", "memberId");
