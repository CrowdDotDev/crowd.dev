-- Create the git schema
CREATE SCHEMA IF NOT EXISTS git;

-- Main repositories table
CREATE TABLE git.repositories (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP WITH TIME ZONE,
    
    -- Repository identification
    url VARCHAR(1024) NOT NULL,
    
    -- Processing state and priority
    state VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 1, -- 0=urgent, 1=high, 2=normal
    
    -- Processing metadata
    "lastProcessedAt" TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    UNIQUE (url)
);

-- Repository to Integration associations (many-to-many)
CREATE TABLE git."repositoryIntegrations" (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    "repositoryId" UUID NOT NULL REFERENCES git.repositories (id) ON DELETE CASCADE,
    "integrationId" UUID NOT NULL REFERENCES public."integrations" (id) ON DELETE CASCADE,
    
    -- Constraints
    UNIQUE ("repositoryId", "integrationId")
);

-- Function to clean up orphaned repositories
CREATE OR REPLACE FUNCTION git.cleanup_orphaned_repositories()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete repositories that no longer have any associations
    DELETE FROM git.repositories 
    WHERE id NOT IN (
        SELECT DISTINCT "repositoryId" 
        FROM git."repositoryIntegrations"
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up orphaned repositories after association deletion
CREATE TRIGGER cleanup_orphaned_repositories_trigger
    AFTER DELETE ON git."repositoryIntegrations"
    FOR EACH ROW
    EXECUTE FUNCTION git.cleanup_orphaned_repositories();



-- Create indexes for optimal query performance

-- Repositories indexes
CREATE INDEX "ix_git_repositories_state" ON git.repositories (state);
CREATE INDEX "ix_git_repositories_priority" ON git.repositories (priority);
CREATE INDEX "ix_git_repositories_state_priority" ON git.repositories (state, priority);
CREATE INDEX "ix_git_repositories_lastProcessedAt" ON git.repositories ("lastProcessedAt");

-- Repository Integrations indexes
CREATE INDEX "ix_git_repositoryIntegrations_repositoryId" ON git."repositoryIntegrations" ("repositoryId");
CREATE INDEX "ix_git_repositoryIntegrations_integrationId" ON git."repositoryIntegrations" ("integrationId");



-- Add comments for documentation
COMMENT ON SCHEMA git IS 'Schema for git integration system that manages repository processing and integration associations';
COMMENT ON TABLE git.repositories IS 'Stores git repository metadata and processing state for the git integration system';
COMMENT ON TABLE git."repositoryIntegrations" IS 'Many-to-many relationship between repositories and integrations';

COMMENT ON COLUMN git.repositories.priority IS 'Processing priority: 0=urgent, 1=high, 2=normal';
COMMENT ON COLUMN git.repositories.state IS 'Current processing state of the repository'; 