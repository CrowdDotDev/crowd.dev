DROP INDEX CONCURRENTLY IF EXISTS ix_unique_activities_tenantid_platform_type_sourceid_segmentid_channel;
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS activities_tenant_segment_source_id_idx ON activities ("tenantId", "segmentId", "sourceId");
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS ix_unique_activities_tenantid_platform_type_sourceid_segmentid ON activities ("tenantId", platform, type, "sourceId", "segmentId");
