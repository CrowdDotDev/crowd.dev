DROP TRIGGER IF EXISTS cleanup_orphaned_repositories_trigger ON git."repositoryIntegrations";
DROP FUNCTION IF EXISTS git.cleanup_orphaned_repositories();

DROP TABLE IF EXISTS git."repositoryIntegrations";
