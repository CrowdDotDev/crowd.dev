-- Remove branch column from git.repositories table
ALTER TABLE git.repositories 
DROP COLUMN IF EXISTS "branch";
