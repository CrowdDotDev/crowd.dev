-- Add lockedAt column to git.repositories table
-- This column tracks when a repository was locked for processing

ALTER TABLE git.repositories 
ADD COLUMN "lockedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN git.repositories."lockedAt" IS 'Timestamp when the repository was locked for processing, NULL if not locked';
