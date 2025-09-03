-- Add integrationId and segmentId columns to git.repositories table
-- These columns reference segments and integrations from public schema
-- Both are nullable and set to null on delete

ALTER TABLE git.repositories 
ADD COLUMN "integrationId" UUID REFERENCES public.integrations (id) ON DELETE SET NULL,
ADD COLUMN "segmentId" UUID REFERENCES public.segments (id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX "ix_git_repositories_integrationId" ON git.repositories ("integrationId");
CREATE INDEX "ix_git_repositories_segmentId" ON git.repositories ("segmentId");
CREATE INDEX "ix_git_repositories_integrationId_segmentId" ON git.repositories ("integrationId", "segmentId"); 