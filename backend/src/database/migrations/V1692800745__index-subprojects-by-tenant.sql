CREATE INDEX CONCURRENTLY IF NOT EXISTS segments_tenant_subprojects ON segments ("tenantId") WHERE "grandparentSlug" IS NOT NULL AND "parentSlug" IS NOT NULL;
