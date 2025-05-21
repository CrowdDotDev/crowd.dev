alter table "memberSegmentsAgg"
    drop column if exists "updatedAt";

alter table "organizationSegmentsAgg"
    drop column if exists "createdAt";

alter table "organizationSegmentsAgg"
    drop column if exists "updatedAt";

drop table if exists "systemSettings";
