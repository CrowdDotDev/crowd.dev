alter table "memberSegmentsAgg"
    drop column if exists "updatedAt";

alter table "organizationSegmentsAgg"
    drop column if exists "createdAt";

alter table "organizationSegmentsAgg"
    drop column if exists "updatedAt";

drop index concurrently if exists "idx_indexed_entities_type_indexed_at_entity_id";

drop table if exists "systemSettings";
