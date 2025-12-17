-- Remove stuckRequiresReOnboard column from git.repositories table
-- Rollback for V1764675824__addStuckReOnboardColumnToGitRepositories.sql

ALTER TABLE git.repositories 
DROP COLUMN IF EXISTS "stuckRequiresReOnboard";

