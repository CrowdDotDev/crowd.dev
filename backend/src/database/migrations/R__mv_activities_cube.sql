DROP MATERIALIZED VIEW IF EXISTS mv_activities_cube;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_activities_cube AS
SELECT
    a.id,
    a."isContribution",
    a."tenantId",
    a."memberId",
    a."username",
    (a.platform)::VARCHAR(24),
    (a.channel)::VARCHAR(256),
    a.timestamp,
    (a.type)::VARCHAR(256),
    CASE
        WHEN a.sentiment->>'sentiment' is null THEN 'no data'
        WHEN (a.sentiment->>'sentiment')::integer < 34 THEN 'negative'
        WHEN (a.sentiment->>'sentiment')::integer > 66 THEN 'positive'
        ELSE 'neutral'
    END::VARCHAR(8) AS "sentimentMood",
    a."organizationId",
    a."segmentId",
    a."conversationId",
    a."createdAt"
FROM activities a
WHERE a."deletedAt" IS NULL
;

CREATE INDEX IF NOT EXISTS mv_activities_cube_timestamp ON mv_activities_cube (timestamp);
CREATE INDEX IF NOT EXISTS mv_activities_cube_platform ON mv_activities_cube (platform);
CREATE INDEX IF NOT EXISTS mv_activities_cube_org_id ON mv_activities_cube ("organizationId");
CREATE INDEX IF NOT EXISTS mv_activities_cube_segment_id ON mv_activities_cube ("segmentId");

CREATE UNIQUE INDEX IF NOT EXISTS mv_activities_cube_id ON mv_activities_cube (id);
CREATE INDEX IF NOT EXISTS mv_activities_cube_tenantId_timestamp_idx ON mv_activities_cube ("tenantId", "timestamp");
CREATE INDEX IF NOT EXISTS mv_activities_cube_member_id_timestamp ON mv_activities_cube ("memberId", timestamp);
CREATE INDEX IF NOT EXISTS mv_activities_cube_platform_username ON mv_activities_cube ("platform", username);

CREATE INDEX IF NOT EXISTS mv_activities_cube_tenant_segment ON mv_activities_cube ("tenantId", "segmentId");
