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
