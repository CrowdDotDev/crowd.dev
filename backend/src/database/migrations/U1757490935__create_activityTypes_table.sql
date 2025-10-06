DROP INDEX IF EXISTS "idx_activityTypes_updatedAt";

ALTER PUBLICATION sequin_pub DROP TABLE "activityTypes";

DROP TABLE "activityTypes";
