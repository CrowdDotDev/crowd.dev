drop materialized view "memberActivityAggregatesMVs";

create materialized view "memberActivityAggregatesMVs" as
WITH identities AS (
         SELECT mi."memberId",
            array_agg(DISTINCT mi.platform) AS identities,
            jsonb_object_agg(mi.platform, mi.usernames) AS username
           FROM ( SELECT sub."memberId",
                    sub.platform,
                    array_agg(sub.username) AS usernames
                   FROM ( SELECT "memberIdentities"."memberId",
                            "memberIdentities".platform,
                            "memberIdentities".username,
                            "memberIdentities"."createdAt",
                            (row_number() OVER (PARTITION BY "memberIdentities"."memberId", "memberIdentities".platform ORDER BY "memberIdentities"."createdAt" DESC) = 1) AS is_latest
                           FROM "memberIdentities") sub
                  WHERE sub.is_latest
                  GROUP BY sub."memberId", sub.platform) mi
          GROUP BY mi."memberId"
        )
 SELECT m.id,
    max(a."timestamp") AS "lastActive",
    i.identities,
    i.username,
    count(a.id) AS "activityCount",
    array_agg(DISTINCT concat(a.platform, ':', a.type)) FILTER (WHERE (a.platform IS NOT NULL)) AS "activityTypes",
    array_agg(DISTINCT a.channel) filter (WHERE a.platform is not null) as "activityChannels",
    array_agg(DISTINCT a.platform) FILTER (WHERE (a.platform IS NOT NULL)) AS "activeOn",
    count(DISTINCT (a."timestamp")::date) AS "activeDaysCount",
    round((avg(
        CASE
            WHEN ((a.sentiment ->> 'sentiment'::text) IS NOT NULL) THEN ((a.sentiment ->> 'sentiment'::text))::double precision
            ELSE NULL::double precision
        END))::numeric, 2) AS "averageSentiment"
   FROM ((members m
     JOIN identities i ON ((m.id = i."memberId")))
     LEFT JOIN activities a ON (((m.id = a."memberId") AND (a."deletedAt" IS NULL))))
  GROUP BY m.id, i.identities, i.username;

create unique index ix_memberactivityaggregatesmvs_memberid
    on "memberActivityAggregatesMVs" (id);