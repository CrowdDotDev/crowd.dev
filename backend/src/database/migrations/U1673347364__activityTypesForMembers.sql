drop materialized view "memberActivityAggregatesMVs";

create materialized view "memberActivityAggregatesMVs" as
(
    select 
        m.id,
        max(a.timestamp) as "lastActive",
        count(a.id)      as "activityCount",
        array_agg(
        distinct (concat(a.platform,':',a.type))
            ) filter (
            where
            a.platform is not null
            )            AS "activityTypes",
        array_agg(
        distinct (a.platform)
            ) filter (
            where
            a.platform is not null
            )            AS "activeOn",
        ROUND(
                AVG(CASE
                        WHEN
                                COALESCE(
                                            a."sentiment" ->> 'sentiment',
                                            '0'
                                    ):: float <> 0 THEN COALESCE(
                                    a."sentiment" ->> 'sentiment',
                                    '0'
                            ):: float
                        ELSE NULL end
                    ):: numeric,
                2
            )            AS "averageSentiment"
    from members m
            left outer join activities a on m.id = a."memberId" and a."deletedAt" is null
    group by m.id
);


create unique index ix_memberactivityaggregatesmvs_memberid
    on "memberActivityAggregatesMVs" (id);