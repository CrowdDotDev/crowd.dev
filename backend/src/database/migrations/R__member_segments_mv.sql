drop materialized view if exists member_segments_mv;

create materialized view member_segments_mv as
select distinct "memberId", "segmentId", "tenantId"
from activities
where "deletedAt" is null;

create unique index ix_member_segments_memberid_segmentid on member_segments_mv ("memberId", "segmentId")