CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS  activities_tenant_segment_source_id_idx ON activities ("tenantId", "segmentId", "sourceId") WHERE "deletedAt" IS NULL;
