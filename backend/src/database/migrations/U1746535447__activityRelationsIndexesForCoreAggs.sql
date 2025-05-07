drop index concurrently if exists "ix_activityRelations_memberId_segmentId_include";

drop index concurrently if exists "ix_activityRelations_organizationId_segmentId_include";

alter table "memberSegmentsAgg"
    drop column if exists "updatedAt";

alter table "organizationSegmentsAgg"
    drop column if exists "updatedAt";
