ALTER TABLE public."repositoryGroups"
    REPLICA IDENTITY DEFAULT;
ALTER PUBLICATION sequin_pub DROP TABLE "repositoryGroups";

DROP INDEX IF EXISTS "ix_repositoryGroups_updatedAt_id";

DROP TABLE IF EXISTS "repositoryGroups";
