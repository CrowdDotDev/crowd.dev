-- Create ENUM type for execution status
CREATE TYPE git.execution_status AS ENUM ('success', 'failure');

-- Create service executions table for tracking service execution metrics
CREATE TABLE IF NOT EXISTS git."serviceExecutions" (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "repoId" UUID NOT NULL REFERENCES git.repositories(id) ON DELETE CASCADE,
    "operationType" VARCHAR(50) NOT NULL, -- Service name (e.g., 'Clone', 'Commit', etc.)
    "status" git.execution_status NOT NULL,
    "errorCode" VARCHAR(50), -- Custom error codes
    "errorMessage" TEXT, -- Detailed error message if status is error
    "executionTimeSec" DECIMAL NOT NULL, -- Execution time in seconds
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "idx_serviceExecutions_repoId" ON git."serviceExecutions"("repoId");
CREATE INDEX IF NOT EXISTS "idx_serviceExecutions_operationType" ON git."serviceExecutions"("operationType");
CREATE INDEX IF NOT EXISTS "idx_serviceExecutions_status" ON git."serviceExecutions"("status");
CREATE INDEX IF NOT EXISTS "idx_serviceExecutions_createdAt" ON git."serviceExecutions"("createdAt");
CREATE INDEX IF NOT EXISTS "idx_serviceExecutions_composite" ON git."serviceExecutions"("repoId", "operationType", "status");

CREATE OR REPLACE FUNCTION git.trigger_cleanup_service_executions()
RETURNS trigger AS $$
BEGIN
    -- Only run cleanup 1% of the time (1 in 100 inserts) - due to high write load, keep cleanup minimal to avoid performance impact
    IF RANDOM() < 0.01 THEN
        DELETE FROM git."serviceExecutions" 
        WHERE "createdAt" < NOW() - INTERVAL '14 days';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires on each insert
CREATE TRIGGER trigger_auto_cleanup_service_executions
    AFTER INSERT ON git."serviceExecutions"
    FOR EACH ROW
    EXECUTE FUNCTION git.trigger_cleanup_service_executions();