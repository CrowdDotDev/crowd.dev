CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_activityRelations_memberId_segmentId_timestamp"
ON "activityRelations" ("memberId", "segmentId", "timestamp");