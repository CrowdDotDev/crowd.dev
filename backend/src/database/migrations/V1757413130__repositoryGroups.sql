CREATE TABLE IF NOT EXISTS "repositoryGroups"
(
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL,
    "repositories"      VARCHAR[] DEFAULT ARRAY []::VARCHAR[],
    "insightsProjectId" UUID NOT NULL,
    "createdAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "deletedAt"         TIMESTAMP NULL DEFAULT NULL,
    foreign key ("insightsProjectId") references "insightsProjects" (id) on delete cascade,
    UNIQUE (slug, "insightsProjectId", "deletedAt")
);

create index "ix_repositoryGroups_updatedAt_id" on "repositoryGroups" ("updatedAt", id);

ALTER PUBLICATION sequin_pub ADD TABLE "repositoryGroups";
ALTER TABLE public."repositoryGroups" REPLICA IDENTITY FULL;
