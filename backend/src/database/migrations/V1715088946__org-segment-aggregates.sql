CREATE TABLE "organizationSegmentsAgg" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "segmentId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "joinedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "lastActive" TIMESTAMP WITH TIME ZONE NOT NULL,
    "activeOn" TEXT[] NOT NULL,
    "activityCount" INTEGER NOT NULL,
    "memberCount" INTEGER NOT NULL,
    UNIQUE ("organizationId", "segmentId")
);

INSERT INTO "organizationSegmentsAgg"
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
    ),
    member_data as (
        select a."segmentId",
               a."organizationId",
               ARRAY_AGG(DISTINCT a."memberId") AS "memberIds",
               count(distinct a."memberId")                                               as "memberCount",
               count(distinct a.id)                                                       as "activityCount",
               case
                   when array_agg(distinct a.platform) = array [null] then array []::text[]
                   else array_agg(distinct a.platform) end                                as "activeOn",
               max(a.timestamp)                                                           as "lastActive",
               min(a.timestamp) filter ( where a.timestamp <> '1970-01-01T00:00:00.000Z') as "joinedAt"
        FROM activities a
        group by a."segmentId", a."organizationId"
    )
SELECT
    gen_random_uuid(),
    o."id",
    s.segment_id,
    o."tenantId",
    MIN(md."joinedAt") AS "joinedAt",
    MAX(md."lastActive") AS "lastActive",
    ARRAY_AGG(DISTINCT active_on.item) AS "activeOn",
    SUM(md."activityCount") AS "activityCount",
    COUNT(DISTINCT member_ids.item) AS "memberCount"
FROM organizations o
JOIN member_data md ON o."id" = md."organizationId"
JOIN segments_with_children s ON s.subproject = md."segmentId"
LEFT JOIN LATERAL (SELECT unnest(md."activeOn") as item) active_on ON TRUE
LEFT JOIN LATERAL (SELECT unnest(md."memberIds") as item) member_ids ON TRUE
GROUP BY o."id", s.segment_id, o."tenantId"
;
