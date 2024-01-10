CREATE VIEW "memberSegmentsView" AS
SELECT
    a."memberId",
    a."tenantId",
    a."segmentId",
    NOW() AS "createdAt"
FROM mv_activities_cube a;