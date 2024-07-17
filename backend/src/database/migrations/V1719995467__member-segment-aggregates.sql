CREATE TABLE "memberSegmentsAgg" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "memberId" UUID NOT NULL,
    "segmentId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "activityCount" BIGINT NOT NULL,
    "lastActive" TIMESTAMP WITH TIME ZONE NOT NULL,
    "activityTypes" TEXT[] NOT NULL,
    "activeOn" TEXT[] NOT NULL,
    "averageSentiment" NUMERIC(5, 2), -- 5 digits in total, 2 of them after the decimal point. To account for 100.00
    UNIQUE ("memberId", "segmentId")
);


INSERT INTO "memberSegmentsAgg"
WITH
    segments_with_children AS (
        SELECT
            pg.id AS segment_id,
            'project-group' AS segment_type,
            sp.id AS subproject
        FROM segments pg
        JOIN segments p ON p."parentSlug" = pg.slug AND p."grandparentSlug" IS NULL
        JOIN segments sp ON sp."parentSlug" = p.slug AND sp."grandparentSlug" = p."parentSlug"
        WHERE pg."parentSlug" IS NULL
          AND pg."grandparentSlug" IS NULL

        UNION ALL

        SELECT
            p.id AS segment_id,
            'project' AS segment_type,
            sp.id AS subproject
        FROM segments p
        JOIN segments sp ON sp."parentSlug" = p.slug AND sp."grandparentSlug" = p."parentSlug"
        WHERE p."grandparentSlug" IS NULL

        UNION ALL

        SELECT
            sp.id AS segment_id,
            'subproject' AS segment_type,
            sp.id AS subproject
        FROM segments sp
        WHERE sp."parentSlug" IS NOT NULL AND sp."grandparentSlug" IS NOT NULL
    )
SELECT
    gen_random_uuid(),
    m."id",
    s.segment_id,
    m."tenantId",
    COUNT(DISTINCT a.id) AS "activityCount",
    MAX(a.timestamp) AS "lastActive",
    ARRAY_AGG(DISTINCT CONCAT(a.platform, ':', a.type)) FILTER (WHERE a.platform IS NOT NULL) AS "activityTypes",
    ARRAY_AGG(DISTINCT a.platform) FILTER (WHERE a.platform IS NOT NULL) AS "activeOn",
    ROUND(AVG((a.sentiment ->> 'sentiment')::NUMERIC(5, 2)), 2) AS "averageSentiment"
FROM activities a
JOIN members m ON m."id" = a."memberId"
JOIN segments_with_children s ON s.subproject = a."segmentId"
GROUP BY m."id", s.segment_id, m."tenantId"
ON CONFLICT DO NOTHING;
