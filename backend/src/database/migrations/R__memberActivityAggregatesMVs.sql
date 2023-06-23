DROP MATERIALIZED VIEW "memberActivityAggregatesMVs";

CREATE MATERIALIZED VIEW "memberActivityAggregatesMVs" AS
WITH
    identities AS (
        SELECT
            mi."memberId",
            mi."segmentId",
            ARRAY_AGG(DISTINCT mi.platform) AS identities,
            JSONB_OBJECT_AGG(mi.platform, mi.usernames) AS username
        FROM (
            SELECT
                "memberId",
                platform,
                "segmentId",
                ARRAY_AGG(username) AS usernames
            FROM (
                SELECT
                    mi."memberId",
                    mi.platform,
                    mi.username,
                    mi."createdAt",
                    ms."segmentId",
                    ROW_NUMBER()
                    OVER (PARTITION BY
                        mi."memberId",
                        mi.platform,
                        ms."segmentId"
                        ORDER BY mi."createdAt" DESC) = 1 AS is_latest
                FROM "memberIdentities" mi
                JOIN "memberSegments" ms ON ms."memberId" = mi."memberId"
            ) sub
            WHERE is_latest
            GROUP BY "memberId", platform, "segmentId"
        ) mi
        GROUP BY mi."memberId", "segmentId"
    )
SELECT
    m.id,
    MAX(a."timestamp") AS "lastActive",
    i.identities,
    i.username,
    i."segmentId",
    COUNT(a.id) AS "activityCount",
    ARRAY_AGG(DISTINCT CONCAT(a.platform, ':', a.type)) FILTER (WHERE a.platform IS NOT NULL) AS "activityTypes",
    ARRAY_AGG(DISTINCT a.platform) FILTER (WHERE a.platform IS NOT NULL) AS "activeOn",
    COUNT(DISTINCT a."timestamp"::DATE) AS "activeDaysCount",
    ROUND(AVG((a.sentiment ->> 'sentiment')::NUMERIC), 2) AS "averageSentiment"
FROM members m
JOIN identities i ON m.id = i."memberId"
LEFT JOIN activities a ON m.id = a."memberId" AND a."deletedAt" IS NULL
GROUP BY m.id, i.identities, i.username, i."segmentId";

CREATE UNIQUE INDEX ix_memberactivityaggregatesmvs_memberid_segmentid ON "memberActivityAggregatesMVs" (id, "segmentId");
