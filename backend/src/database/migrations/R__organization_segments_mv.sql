DROP MATERIALIZED VIEW IF EXISTS organization_segments_mv;

CREATE MATERIALIZED VIEW organization_segments_mv AS
SELECT DISTINCT "organizationId", "segmentId", "tenantId"
FROM activities
WHERE "deletedAt" IS NULL;

CREATE UNIQUE INDEX ix_organization_segments_orgid_segmentid ON organization_segments_mv ("organizationId", "segmentId");
CREATE INDEX ix_organization_segments_segmentid ON organization_segments_mv ("segmentId");