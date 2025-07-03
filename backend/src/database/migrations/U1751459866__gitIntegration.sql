DROP TRIGGER IF EXISTS cleanup_orphaned_repositories_trigger ON git."repositoryIntegrations";

-- Drop function
DROP FUNCTION IF EXISTS git.cleanup_orphaned_repositories();

-- Drop indexes
DROP INDEX IF EXISTS "ix_git_repositoryIntegrations_integrationId";
DROP INDEX IF EXISTS "ix_git_repositoryIntegrations_repositoryId";
DROP INDEX IF EXISTS "ix_git_repositories_lastProcessedAt";
DROP INDEX IF EXISTS "ix_git_repositories_state_priority";
DROP INDEX IF EXISTS "ix_git_repositories_priority";
DROP INDEX IF EXISTS "ix_git_repositories_state";

-- Drop tables
DROP TABLE IF EXISTS git."repositoryIntegrations";
DROP TABLE IF EXISTS git.repositories;

-- Drop schema
DROP SCHEMA IF EXISTS git CASCADE; 