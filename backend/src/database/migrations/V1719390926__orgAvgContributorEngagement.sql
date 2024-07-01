ALTER TABLE "organizationSegmentsAgg" ADD COLUMN "avgContributorEngagement" INTEGER;

-- compute avgContributorEngagement for existing organizations
WITH avg_engagement AS (
    SELECT
        a."organizationId",
        a."segmentId",
        COALESCE(ROUND(AVG(a.score)), 0) AS "avgContributorEngagement"
    FROM activities a
    GROUP BY a."organizationId", a."segmentId", a."tenantId"
)
UPDATE "organizationSegmentsAgg" osa
SET "avgContributorEngagement" = ae."avgContributorEngagement"
FROM avg_engagement ae
WHERE osa."organizationId" = ae."organizationId"
AND osa."segmentId" = ae."segmentId";

ALTER TABLE "organizationSegmentsAgg" ALTER COLUMN "avgContributorEngagement" SET NOT NULL;