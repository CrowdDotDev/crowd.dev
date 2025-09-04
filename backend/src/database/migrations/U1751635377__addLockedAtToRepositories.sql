-- Remove lockedAt column from git.repositories table
-- Rollback for V1751635377__addLockedAtToRepositories.sql

ALTER TABLE git.repositories 
DROP COLUMN IF EXISTS "lockedAt";
