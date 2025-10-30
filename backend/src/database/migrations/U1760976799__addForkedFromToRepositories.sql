-- Remove forkedFrom column from git.repositories table
ALTER TABLE git.repositories 
DROP COLUMN IF EXISTS "forkedFrom";

