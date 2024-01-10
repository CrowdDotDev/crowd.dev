CREATE INDEX CONCURRENTLY IF NOT EXISTS conversations_tenant_segment_slug ON conversations ("tenantId", "segmentId", MD5(slug));
