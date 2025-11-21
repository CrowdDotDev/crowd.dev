CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_osa_segment_coalesce_activity_org
ON public."organizationSegmentsAgg" (
  "segmentId",
  (coalesce("activityCount", 0)::integer) DESC,
  "organizationId"
);

CREATE INDEX CONCURRENTLY idx_org_displayname_trgm 
ON organizations USING gin ("displayName" gin_trgm_ops);