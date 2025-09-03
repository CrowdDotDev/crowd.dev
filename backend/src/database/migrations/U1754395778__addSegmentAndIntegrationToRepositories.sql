DROP INDEX IF EXISTS "ix_git_repositories_integrationId_segmentId";
DROP INDEX IF EXISTS "ix_git_repositories_segmentId";
DROP INDEX IF EXISTS "ix_git_repositories_integrationId";

ALTER TABLE git.repositories 
DROP COLUMN IF EXISTS "integrationId",
DROP COLUMN IF EXISTS "segmentId";
