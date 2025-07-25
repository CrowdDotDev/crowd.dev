-- 1. Create the table to map repositories to insights projects
CREATE TABLE IF NOT EXISTS "insightsProjectsRepositories" (
    repository TEXT NOT NULL,
    "insightsProjectId" UUID NOT NULL REFERENCES "insightsProjects"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,
    PRIMARY KEY (repository, "insightsProjectId")
);

-- 2. Enforce that a repository can be assigned to only one active project
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_insights_project_repo
ON "insightsProjectsRepositories" (repository)
WHERE "deletedAt" IS NULL;
