-- 1. Create the table to map repositories to segments
CREATE TABLE IF NOT EXISTS "segmentRepositories" (
    "repository" TEXT NOT NULL UNIQUE,
    "segmentId" UUID NOT NULL REFERENCES "segments"(id) ON DELETE CASCADE,
    "insightsProjectId" UUID REFERENCES "insightsProjects"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excluded" BOOLEAN NOT NULL DEFAULT FALSE,
    "archived" BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY ("repository", "segmentId")
);
