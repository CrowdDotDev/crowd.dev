-- Add metrics column to serviceExecutions table for storing service-specific execution metrics
-- Examples: ai_cost for maintainer service, total_commits/bad_commits/total_activities for commit service

ALTER TABLE git."serviceExecutions" 
ADD COLUMN metrics JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient querying within JSONB data
CREATE INDEX IF NOT EXISTS "idx_serviceExecutions_metrics" 
ON git."serviceExecutions" USING gin (metrics);

