-- Down migration: Remove service executions table and related objects

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_auto_cleanup_service_executions ON git."serviceExecutions";

-- Drop trigger function
DROP FUNCTION IF EXISTS git.trigger_cleanup_service_executions();

-- Drop indexes
DROP INDEX IF EXISTS git."idx_serviceExecutions_composite";
DROP INDEX IF EXISTS git."idx_serviceExecutions_createdAt";
DROP INDEX IF EXISTS git."idx_serviceExecutions_status";
DROP INDEX IF EXISTS git."idx_serviceExecutions_operationType";
DROP INDEX IF EXISTS git."idx_serviceExecutions_repoId";

-- Drop table (this will also drop the foreign key constraint)
DROP TABLE IF EXISTS git."serviceExecutions";

-- Drop ENUM type
DROP TYPE IF EXISTS git.execution_status;
