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

-- For `.../activities/query`
CREATE INDEX IF NOT EXISTS mv_members_cube_id_bot_teammember ON mv_members_cube (id) WHERE (NOT "isBot" AND NOT "isTeamMember");

CREATE UNIQUE INDEX IF NOT EXISTS mv_members_cube_id ON mv_members_cube (id);
