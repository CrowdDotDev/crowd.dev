-- Members
DROP MATERIALIZED VIEW IF EXISTS mv_members_cube;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_members_cube AS
SELECT
    m.id,
    m."tenantId",
    m."joinedAt" AS "joinedAt",
    m.score,
    COALESCE(m.attributes->'location'->>'default', '')::VARCHAR(256) AS location,
    COALESCE((m.attributes->'isBot'->>'default')::BOOLEAN, FALSE) as "isBot",
    COALESCE((m.attributes->'isTeamMember'->>'default')::BOOLEAN, FALSE) as "isTeamMember",
    COALESCE((m.attributes->'isOrganization'->>'default')::BOOLEAN, FALSE) as "isOrganization",
    FLOOR(EXTRACT(EPOCH FROM m."joinedAt"))::BIGINT AS "joinedAtUnixTs"
FROM members m
;

CREATE INDEX IF NOT EXISTS mv_members_cube_tenant ON mv_members_cube ("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS mv_members_cube_id ON mv_members_cube (id);


-- Activities
DROP MATERIALIZED VIEW IF EXISTS mv_activities_cube;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_activities_cube AS
SELECT
    a.id,
    a."isContribution",
    a."tenantId",
    a."memberId",
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
    a."conversationId"
FROM activities a
WHERE a."deletedAt" IS NULL
;

CREATE INDEX IF NOT EXISTS mv_activities_cube_timestamp ON mv_activities_cube (timestamp);
CREATE INDEX IF NOT EXISTS mv_activities_cube_org_id ON mv_activities_cube ("organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS mv_activities_cube_id ON mv_activities_cube (id);
CREATE INDEX IF NOT EXISTS mv_activities_cube_tenantId_timestamp_idx ON mv_activities_cube ("tenantId", "timestamp");


-- Organizations
DROP MATERIALIZED VIEW IF EXISTS mv_organizations_cube;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_organizations_cube AS
SELECT
    o.id,
    o."tenantId",
    o."createdAt",
    MIN(m."joinedAt") AS "earliestJoinedAt"
FROM organizations o
JOIN "memberOrganizations" mo ON o.id = mo."organizationId"
JOIN members m ON mo."memberId" = m.id
JOIN activities a ON o.id = a."organizationId"
GROUP BY o.id
;

CREATE UNIQUE INDEX IF NOT EXISTS mv_organizations_cube_id ON mv_organizations_cube (id);
CREATE INDEX IF NOT EXISTS mv_organizations_cube_tenantId ON mv_organizations_cube ("tenantId");


-- Segments
DROP MATERIALIZED VIEW IF EXISTS mv_segments_cube;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_segments_cube AS
SELECT
    id,
    name
FROM segments
;

CREATE UNIQUE INDEX IF NOT EXISTS mv_segments_cube_id ON mv_segments_cube (id);
