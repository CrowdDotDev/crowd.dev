-- indices to optimize queries for member and organization activity core aggregates
create index concurrently if not exists "ix_activityRelations_memberId_segmentId_include"
on "activityRelations" ("memberId", "segmentId")
include ("platform", "activityId");

create index concurrently if not exists "ix_activityRelations_organizationId_segmentId_include"
on "activityRelations" ("organizationId", "segmentId")
include ("platform", "activityId", "memberId");

-- add "updatedAt" column to track the async aggs updates
alter table "memberSegmentsAgg"
    add column "updatedAt" timestamp with time zone not null default now();

alter table "organizationSegmentsAgg"
    add column "updatedAt" timestamp with time zone not null default now();

-- for existing rows, set the initial value to the createdAt value
update "memberSegmentsAgg" set "updatedAt" = "createdAt";

update "organizationSegmentsAgg" set "updatedAt" = "createdAt";
