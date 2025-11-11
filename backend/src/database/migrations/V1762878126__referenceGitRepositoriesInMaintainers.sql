-- Migration to add foreign key constraint from maintainersInternal.repoId to git.repositories.id
-- This creates the new reference to git.repositories table
-- The old reference to githubRepos.id should have been removed in the removeGithubReposReferenceFromMaintainers migration

ALTER TABLE "maintainersInternal"
ADD CONSTRAINT "maintainersInternal_repoId_fkey"
FOREIGN KEY ("repoId")
REFERENCES git.repositories(id)
ON DELETE CASCADE;

