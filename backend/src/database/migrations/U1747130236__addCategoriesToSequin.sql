ALTER TABLE public."categoryGroups"
    REPLICA IDENTITY DEFAULT;
ALTER TABLE public."categories"
    REPLICA IDENTITY DEFAULT;
ALTER PUBLICATION sequin_pub DROP TABLE "categoryGroups";
ALTER PUBLICATION sequin_pub DROP TABLE "categories";

DROP INDEX IF EXISTS "ix_categoryGroups_updatedAt_id";
DROP INDEX IF EXISTS "ix_categories_updatedAt_id";
