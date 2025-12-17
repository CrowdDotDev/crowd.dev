-- Migration to remove the foreign key constraint from maintainersInternal.repoId to githubRepos.id
-- This removes the dependency on githubRepos table and creates the new reference to git.repositories table

ALTER TABLE "maintainersInternal"
DROP CONSTRAINT IF EXISTS "maintainersInternal_repoId_fkey";

ALTER TABLE "maintainersInternal"
ADD CONSTRAINT "maintainersInternal_repoId_fkey"
FOREIGN KEY ("repoId")
REFERENCES git.repositories(id)
ON DELETE CASCADE;