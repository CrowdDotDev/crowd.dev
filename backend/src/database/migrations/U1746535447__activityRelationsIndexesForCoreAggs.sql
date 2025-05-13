-- Drop columns from "tenants" table
alter table "tenants"
    drop column if exists "lastMemberDisplayAggsSyncedAt";

alter table "tenants"
    drop column if exists "lastOrganizationDisplayAggsSyncedAt";

-- Drop indexes from "activityRelations" table
drop index concurrently if exists "ix_activityRelations_memberId_segmentId_include";
drop index concurrently if exists "ix_activityRelations_organizationId_segmentId_include";

-- Remove "updatedAt" column from "memberSegmentsAgg"
alter table "memberSegmentsAgg"
    drop column if exists "updatedAt";

-- Remove "createdAt" and "updatedAt" columns from "organizationSegmentsAgg"
alter table "organizationSegmentsAgg"
    drop column if exists "createdAt";

alter table "organizationSegmentsAgg"
    drop column if exists "updatedAt";

drop index concurrently if exists "idx_indexed_entities_type_indexed_at_entity_id";

drop table if exists "systemSettings";
