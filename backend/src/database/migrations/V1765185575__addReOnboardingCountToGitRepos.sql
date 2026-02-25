-- Add reOnboardingCount column to git.repositories table
-- This column tracks the number of times a repository has been re-onboarded.
-- It is used to identify unreachable commits by matching against activity.attributes.cycle=onboarding-{reOnboardingCount}
ALTER TABLE git.repositories 
ADD COLUMN "reOnboardingCount" INTEGER default 0 NOT NULL;

COMMENT ON COLUMN git.repositories."reOnboardingCount" IS 'Tracks the number of times this repository has been re-onboarded. Used to identify unreachable commits via activity.attributes.cycle matching pattern onboarding-{reOnboardingCount}';