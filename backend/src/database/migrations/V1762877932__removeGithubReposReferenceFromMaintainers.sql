-- Migration to remove the foreign key constraint from maintainersInternal.repoId to githubRepos.id
-- This removes the dependency on githubRepos table
-- The new foreign key to git.repositories.id will be added in the referenceGitRepositoriesInMaintainers migration

ALTER TABLE "maintainersInternal"
DROP CONSTRAINT IF EXISTS "maintainersInternal_repoId_fkey";

