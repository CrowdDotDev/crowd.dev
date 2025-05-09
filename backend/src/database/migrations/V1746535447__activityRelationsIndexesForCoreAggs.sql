-- Timestamps for incremental updates of member/org display aggregates
alter table "tenants"
    add column "lastMemberDisplayAggsSyncedAt" timestamp with time zone;

alter table "tenants"
    add column "lastOrganizationDisplayAggsSyncedAt" timestamp with time zone;

-- Indexes to optimize queries for member and organization activity core aggregates
create index concurrently if not exists "ix_activityRelations_memberId_segmentId_include"
on "activityRelations" ("memberId", "segmentId")
include ("platform", "activityId");

create index concurrently if not exists "ix_activityRelations_organizationId_segmentId_include"
on "activityRelations" ("organizationId", "segmentId")
include ("platform", "activityId", "memberId");

-- Add "updatedAt" column to track the async aggs updates
alter table "memberSegmentsAgg"
    add column "updatedAt" timestamp with time zone not null default now();

-- For existing rows, set the initial value to the createdAt value
update "memberSegmentsAgg" set "updatedAt" = "createdAt";

-- Adding "createdAt" and "updatedAt" to make it consistent with the memberSegmentsAgg table.
alter table "organizationSegmentsAgg"
    add column "createdAt" timestamp with time zone not null default now();

alter table "organizationSegmentsAgg"
    add column "updatedAt" timestamp with time zone not null default now();

-- Index to optimize fetching recently indexed entities
create index concurrently if not exists "idx_indexed_entities_type_indexed_at_entity_id"
on "indexed_entities" ("type", "indexed_at", "entity_id");

-- Redundant index on indexed_entities
drop index if exists ix_indexed_entities_type_entity_id;