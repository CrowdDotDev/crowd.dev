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
CREATE INDEX IF NOT EXISTS mv_members_cube_is_bot ON mv_members_cube ("isBot");
CREATE INDEX IF NOT EXISTS mv_members_cube_is_team_member ON mv_members_cube ("isTeamMember");
CREATE INDEX IF NOT EXISTS mv_members_cube_is_organization ON mv_members_cube ("isOrganization");
CREATE INDEX IF NOT EXISTS mv_members_cube_joined_at ON mv_members_cube ("joinedAt");


CREATE UNIQUE INDEX IF NOT EXISTS mv_members_cube_id ON mv_members_cube (id);


-- Activities
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
CREATE INDEX mv_activities_cube_member_id_timestamp ON mv_activities_cube ("memberId", timestamp);
CREATE INDEX mv_activities_cube_platform_username ON mv_activities_cube ("platform", username);



-- Organizations
DROP MATERIALIZED VIEW IF EXISTS mv_organizations_cube;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_organizations_cube AS
SELECT
    o.id,
    o."tenantId",
    o."createdAt",
    MIN(a.timestamp) FILTER (WHERE a.timestamp <> '1970-01-01T00:00:00.000Z') AS "earliestJoinedAt"
FROM organizations o
JOIN "memberOrganizations" mo ON o.id = mo."organizationId"
JOIN members m ON mo."memberId" = m.id
JOIN activities a ON o.id = a."organizationId"
GROUP BY o.id
;

CREATE UNIQUE INDEX IF NOT EXISTS mv_organizations_cube_id ON mv_organizations_cube (id);
CREATE INDEX IF NOT EXISTS mv_organizations_cube_tenantId ON mv_organizations_cube ("tenantId");
CREATE INDEX IF NOT EXISTS mv_organizations_cube_joined_at ON mv_organizations_cube ("earliestJoinedAt");


-- Segments
DROP MATERIALIZED VIEW IF EXISTS mv_segments_cube;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_segments_cube AS
SELECT
    id,
    name
FROM segments
;

CREATE UNIQUE INDEX IF NOT EXISTS mv_segments_cube_id ON mv_segments_cube (id);
