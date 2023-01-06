ALTER TABLE public."reports" ADD COLUMN "isTemplate" BOOLEAN NOT NULL DEFAULT FALSE;

drop materialized view "memberActivityAggregatesMVs";

create materialized view "memberActivityAggregatesMVs" as
SELECT m.id,
       max(a."timestamp")                                                   AS "lastActive",
       count(a.id)                                                          AS "activityCount",
       array_agg(DISTINCT a.platform) FILTER (WHERE a.platform IS NOT NULL) AS "activeOn",
       count(distinct a.timestamp::date)                                    AS "activeDaysCount",
       round(avg(
                     CASE
                         WHEN (a.sentiment ->> 'sentiment'::text) IS NOT NULL
                             THEN (a.sentiment ->> 'sentiment'::text)::double precision
                         ELSE NULL::double precision
                         END)::numeric, 2)                                  AS "averageSentiment"
FROM members m
         LEFT JOIN activities a ON m.id = a."memberId" AND a."deletedAt" IS NULL
GROUP BY m.id;

create unique index ix_memberactivityaggregatesmvs_memberid
    on "memberActivityAggregatesMVs" (id);