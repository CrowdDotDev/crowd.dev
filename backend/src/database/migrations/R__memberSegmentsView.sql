CREATE VIEW "memberSegmentsView" AS
SELECT a."memberId",
       a."tenantId",
       a."segmentId",
       NOW() AS "createdAt"
FROM mv_activities_cube a
GROUP BY a."memberId", a."segmentId", a."tenantId";