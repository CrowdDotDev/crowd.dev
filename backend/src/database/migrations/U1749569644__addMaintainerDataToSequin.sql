ALTER TABLE public."maintainersInternal"
    REPLICA IDENTITY DEFAULT;
ALTER PUBLICATION sequin_pub DROP TABLE "maintainersInternal";

DROP INDEX IF EXISTS "ix_maintainersInternal_updatedAt_id";
