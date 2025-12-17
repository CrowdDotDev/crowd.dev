-- Down migration: Remove metrics column and index from serviceExecutions table

-- Drop index first
DROP INDEX IF EXISTS git."idx_serviceExecutions_metrics";

-- Drop column
ALTER TABLE git."serviceExecutions" 
DROP COLUMN IF EXISTS metrics;

