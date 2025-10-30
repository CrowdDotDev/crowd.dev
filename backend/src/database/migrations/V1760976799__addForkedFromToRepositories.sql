ALTER TABLE git.repositories 
ADD COLUMN "forkedFrom" VARCHAR(512) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN git.repositories."forkedFrom" IS 'The source repository URL if this repository is a fork (e.g., https://github.com/original-owner/original-repo).';

