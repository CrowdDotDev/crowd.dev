drop materialized view "memberActivityAggregatesMVs";

create materialized view "memberActivityAggregatesMVs" as
with identities as (select mi."memberId",
                           array_agg(distinct mi.platform)             as identities,
                           jsonb_object_agg(mi.platform, mi.usernames) as username
                    from (select "memberId",
                                 platform,
                                 array_agg(username) as usernames
                          from (select "memberId",
                                       platform,
                                       username,
                                       "createdAt",
                                       row_number() over (partition by "memberId", platform order by "createdAt" desc) =
                                       1 as is_latest
                                from "memberIdentities") sub
                          where is_latest
                          group by "memberId", platform) mi
                    group by mi."memberId")
select m.id,
       max(a."timestamp")                                                                        as "lastActive",
       i.identities,
       i.username,
       count(a.id)                                                                               as "activityCount",
       array_agg(distinct concat(a.platform, ':', a.type)) filter (where a.platform is not null) as "activityTypes",
       array_agg(distinct a.platform) filter (where a.platform is not null)                      as "activeOn",
       count(distinct a."timestamp"::date)                                                       as "activeDaysCount",
       round(avg(
                 case
                     when (a.sentiment ->> 'sentiment') is not null
                         then (a.sentiment ->> 'sentiment')::double precision
                     else null::double precision
                 end)::numeric, 2)                                                       as "averageSentiment"
from members m
join identities i on m.id = i."memberId"
left join activities a on m.id = a."memberId" and a."deletedAt" is null
group by m.id, i.identities, i.username;

create unique index ix_memberactivityaggregatesmvs_memberid
    on "memberActivityAggregatesMVs" (id);
