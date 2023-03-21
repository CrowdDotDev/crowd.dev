drop materialized view "memberActivityAggregatesMVs";

create materialized view "memberActivityAggregatesMVs" as
select m.id,
       max(a."timestamp")                                                   as "lastActive",
       count(a.id)                                                          as "activityCount",
       array_agg(
       distinct (concat(a.platform, ':', a.type))
           ) filter (
           where
           a.platform is not null
           )                                                                as "activityTypes",
       array_agg(distinct a.platform) filter (where a.platform is not null) as "activeOn",
       count(distinct a.timestamp::date)                                    as "activeDaysCount",
       round(avg(
                     case
                         when (a.sentiment ->> 'sentiment'::text) is not null
                             then (a.sentiment ->> 'sentiment'::text)::double precision
                         else null::double precision
                         end)::numeric, 2)                                  as "averageSentiment"
from members m
         left join activities a on m.id = a."memberId" and a."deletedAt" is null
group by m.id;

create unique index ix_memberactivityaggregatesmvs_memberid
    on "memberActivityAggregatesMVs" (id);


