-- Remove "isLF" column from "collections" table
ALTER TABLE "collections"
    DROP COLUMN IF EXISTS "isLF";

-- Add "isLF" column to "insightsProject" table
ALTER TABLE "insightsProjects"
    ADD COLUMN "isLF" BOOLEAN;

-- Update the "isLF" column based on the value of "segmentId"
UPDATE "insightsProjects"
SET "isLF" = CASE
                 WHEN "segmentId" IS NOT NULL THEN TRUE
                 ELSE FALSE
    END;

-- Ensure the "isLF" column does not allow NULL values (if appropriate)
ALTER TABLE "insightsProjects"
    ALTER COLUMN "isLF" SET NOT NULL;
