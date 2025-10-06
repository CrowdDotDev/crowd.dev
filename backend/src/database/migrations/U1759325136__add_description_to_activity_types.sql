-- Revert: Drop description column from activityTypes table
-- This reverts migration V1759325136__add_description_to_activity_types.sql

ALTER TABLE "activityTypes" DROP COLUMN description;