DROP INDEX CONCURRENTLY IF EXISTS activities_tenant_segment_source_id_idx;
DROP INDEX CONCURRENTLY IF EXISTS ix_unique_activities_tenantid_platform_type_sourceid_segmentid;
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS ix_unique_activities_tenantid_platform_type_sourceid_segmentid_channel ON activities ("tenantId", platform, type, "sourceId", "segmentId", channel)