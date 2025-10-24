-- drop old materialized view if exists
drop materialized view if exists "organizationsGlobalActivityCount" cascade;

-- create the materialized view
create materialized view "organizationsGlobalActivityCount" as
select 
    osa."organizationId",
    sum(osa."activityCount") as total_count_estimate
from "organizationSegmentsAgg" osa
where osa."segmentId" in (
    select id
    from segments
    where "grandparentId" is not null
      and "parentId" is not null
)
group by osa."organizationId"
order by sum(osa."activityCount") desc;

create unique index ix_organization_global_activity_count_organization_id
    on "organizationsGlobalActivityCount" ("organizationId");

create index ix_organization_global_activity_count_estimate on "organizationsGlobalActivityCount" (total_count_estimate);
