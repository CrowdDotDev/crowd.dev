DROP MATERIALIZED VIEW "memberActivityAggregatesMVs";

CREATE MATERIALIZED VIEW "memberActivityAggregatesMVs" AS
WITH
    identities AS (
        SELECT
            mi."memberId",
            ARRAY_AGG(DISTINCT mi.platform) AS identities,
            JSONB_OBJECT_AGG(mi.platform, mi.usernames) AS username
        FROM (
            SELECT
                "memberId",
                platform,
                ARRAY_AGG(username) AS usernames
            FROM (
                SELECT
                    "memberId",
                    platform,
                    username,
                    "createdAt",
                    ROW_NUMBER() OVER (PARTITION BY "memberId", platform ORDER BY "createdAt" DESC) =
                    1 AS is_latest
                FROM "memberIdentities"
            ) sub
            WHERE is_latest
            GROUP BY "memberId", platform
        ) mi
        GROUP BY mi."memberId"
    )
SELECT
    m.id,
    MAX(a."timestamp") AS "lastActive",
    i.identities,
    i.username,
    COUNT(a.id) AS "activityCount",
    ARRAY_AGG(DISTINCT CONCAT(a.platform, ':', a.type)) FILTER (WHERE a.platform IS NOT NULL) AS "activityTypes",
    ARRAY_AGG(DISTINCT a.platform) FILTER (WHERE a.platform IS NOT NULL) AS "activeOn",
    COUNT(DISTINCT a."timestamp"::DATE) AS "activeDaysCount",
    ROUND(AVG(
              CASE
                  WHEN (a.sentiment ->> 'sentiment') IS NOT NULL
                      THEN (a.sentiment ->> 'sentiment')::DOUBLE PRECISION
                  ELSE NULL::DOUBLE PRECISION
              END)::NUMERIC, 2) AS "averageSentiment"
FROM members m
JOIN identities i ON m.id = i."memberId"
LEFT JOIN activities a ON m.id = a."memberId" AND a."deletedAt" IS NULL
GROUP BY m.id, i.identities, i.username;

CREATE UNIQUE INDEX ix_memberactivityaggregatesmvs_memberid ON "memberActivityAggregatesMVs" (id);
