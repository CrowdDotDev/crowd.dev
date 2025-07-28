-- 1. Create the table to map repositories to insights projects
CREATE TABLE IF NOT EXISTS "segmentRepositories" (
    repository TEXT NOT NULL,
    "segmentId" UUID NOT NULL REFERENCES "segments"(id) ON DELETE CASCADE,
    "insightsProjectId" UUID NOT NULL REFERENCES "insightsProjects"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,
    "archivedAt" TIMESTAMPTZ,
    "excludedAt" TIMESTAMPTZ,
    PRIMARY KEY (repository, "segmentId")
);

-- 2. Enforce that a repository can be assigned to only one active segment
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_segment_repos
ON "segmentRepositories" (repository)
WHERE "deletedAt" IS NULL;
