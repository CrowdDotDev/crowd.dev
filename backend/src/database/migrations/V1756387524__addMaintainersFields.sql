-- Add missing columns to maintainersInternal table (only if they don't exist)
ALTER TABLE "maintainersInternal" 
ADD COLUMN IF NOT EXISTS "originalRole" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP WITHOUT TIME ZONE;
