ALTER TABLE git.repositories 
ADD COLUMN "lastProcessedCommit" VARCHAR(64) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN git.repositories."lastProcessedCommit" IS 'The most recent commit hash that has been processed';
