drop materialized view "memberActivityAggregatesMVs";

create materialized view "memberActivityAggregatesMVs" as
with identities as (select "memberId",
                           array_agg(distinct platform)                as identities,
                           jsonb_object_agg(platform, latest_username) as username,
                           jsonb_object_agg(platform, usernames)       as "newUsername"
                    from (select "memberId",
                                 platform,
                                 first_value(username)
                                 over (partition by "memberId", platform order by "createdAt" desc) as latest_username,
                                 jsonb_agg(username) over (partition by "memberId", platform)       as usernames
                          from "memberIdentities") ranked
                    group by "memberId")
select m.id,
       max(a."timestamp")                                                   as "lastActive",
       i.identities,
       i.username,
       i."newUsername",
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
         inner join identities i on m.id = i."memberId"
         left join activities a on m.id = a."memberId" and a."deletedAt" is null
group by m.id, i.identities, i.username, i."newUsername";

create unique index ix_memberactivityaggregatesmvs_memberid
    on "memberActivityAggregatesMVs" (id);