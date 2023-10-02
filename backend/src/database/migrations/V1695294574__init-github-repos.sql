INSERT INTO "githubRepos" ("tenantId", "integrationId", "segmentId", "url")
WITH repos AS (
    SELECT
        "tenantId",
        id AS "integrationId",
        "segmentId",
        JSONB_ARRAY_ELEMENTS(settings -> 'repos') ->> 'url' AS url,
        ROW_NUMBER() OVER (PARTITION BY "tenantId", JSONB_ARRAY_ELEMENTS(settings -> 'repos') ->> 'url' ORDER BY "createdAt" DESC) AS rn
    FROM integrations
    WHERE platform = 'github'
      AND "deletedAt" IS NULL
)
SELECT
    "tenantId",
    "integrationId",
    "segmentId",
    url
FROM repos
WHERE rn = 1
ON CONFLICT DO NOTHING;
