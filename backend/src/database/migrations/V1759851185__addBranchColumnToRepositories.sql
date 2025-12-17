ALTER TABLE git.repositories 
ADD COLUMN "branch" VARCHAR(255) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN git.repositories."branch" IS 'The default branch being tracked for this repository (e.g., main, master, develop).';
