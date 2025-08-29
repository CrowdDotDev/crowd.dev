ALTER TABLE git.repositories 
ADD COLUMN "lastMaintainerRunAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN git.repositories."lastMaintainerRunAt" IS 'Timestamp of when the repository maintainer processing was last executed';
