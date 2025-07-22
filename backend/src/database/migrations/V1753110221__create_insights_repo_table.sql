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

-- 3. Create or replace the sync function
CREATE OR REPLACE FUNCTION sync_repositories()
RETURNS TRIGGER AS $function$
DECLARE
    repo TEXT;
    i INT;
    project_id UUID := COALESCE(NEW.id, OLD.id);
BEGIN
    RAISE WARNING 'Trigger fired with operation: %, project ID: %', TG_OP, project_id;

    -- DELETE: soft-delete all repositories when a project is deleted
    IF TG_OP = 'DELETE' THEN
        RAISE WARNING 'Soft-deleting all repositories for deleted project %', project_id;

        UPDATE "insightsProjectsRepositories"
        SET "deletedAt" = CURRENT_TIMESTAMP
        WHERE "insightsProjectId" = project_id AND "deletedAt" IS NULL;

        RETURN OLD;
    END IF;

    -- INSERT or UPDATE: shared logic
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        -- On UPDATE, skip if repositories did not change
        IF TG_OP = 'UPDATE' AND OLD.repositories IS NOT DISTINCT FROM NEW.repositories THEN
            RAISE WARNING 'Repositories unchanged for project %, skipping update logic', project_id;
            RETURN NEW;
        END IF;

        -- On UPDATE: soft-delete only removed repositories
        IF TG_OP = 'UPDATE' THEN
            RAISE WARNING 'Soft-deleting removed repositories for project %', project_id;

            UPDATE "insightsProjectsRepositories"
            SET "deletedAt" = CURRENT_TIMESTAMP
            WHERE "insightsProjectId" = project_id
              AND "deletedAt" IS NULL
              AND repository NOT IN (SELECT unnest(NEW.repositories));
        END IF;

        -- If no repositories provided, exit
        IF NEW.repositories IS NULL THEN
            RAISE WARNING 'No repositories to insert for project %', project_id;
            RETURN NEW;
        END IF;

        RAISE WARNING 'Processing repositories for project %', project_id;

        -- Loop through repositories and insert or revive
        FOR i IN COALESCE(array_lower(NEW.repositories, 1), 1)..COALESCE(array_upper(NEW.repositories, 1), 0)
        LOOP
            repo := NEW.repositories[i];
            RAISE WARNING 'Ensuring repository "%", project ID: %', repo, project_id;

            -- Check if this repo is already assigned to another active project
            PERFORM 1 FROM "insightsProjectsRepositories"
            WHERE repository = repo
              AND "insightsProjectId" != project_id
              AND "deletedAt" IS NULL;

            IF FOUND THEN
                RAISE EXCEPTION 'Repository "%" is already assigned to another project.', repo;
            END IF;

            -- Try to revive a previously soft-deleted record
            UPDATE "insightsProjectsRepositories"
            SET "deletedAt" = NULL, "createdAt" = CURRENT_TIMESTAMP
            WHERE repository = repo
              AND "insightsProjectId" = project_id
              AND "deletedAt" IS NOT NULL;

            -- If not found, insert new
            IF NOT FOUND THEN
                INSERT INTO "insightsProjectsRepositories" (repository, "insightsProjectId")
                VALUES (repo, project_id)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$function$ LANGUAGE plpgsql;

-- 4. Create the trigger to call the function on INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS trg_insights_projects_repositories_sync ON "insightsProjects";

CREATE TRIGGER trg_insights_projects_repositories_sync
AFTER INSERT OR DELETE OR UPDATE ON "insightsProjects"
FOR EACH ROW
EXECUTE FUNCTION sync_repositories();
