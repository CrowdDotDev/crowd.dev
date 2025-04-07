-- Remove "isLf" column from "insightsProjects" table
ALTER TABLE "insightsProjects"
    DROP COLUMN IF EXISTS "isLF";

-- Add "isLf" column to "collections" table
ALTER TABLE "collections"
    ADD COLUMN "isLF" BOOLEAN NOT NULL DEFAULT FALSE;
