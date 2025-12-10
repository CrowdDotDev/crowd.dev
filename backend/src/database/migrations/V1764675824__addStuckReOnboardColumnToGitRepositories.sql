-- Add stuckRequiresReOnboard column to git.repositories table
-- This column indicates if a repository is stuck and requires re-onboarding

ALTER TABLE git.repositories 
ADD COLUMN "stuckRequiresReOnboard" BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN git.repositories."stuckRequiresReOnboard" IS 'Indicates if the stuck repository is resolved by a re-onboarding';

