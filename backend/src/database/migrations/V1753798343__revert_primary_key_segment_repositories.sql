-- 1. Drop the current primary key
ALTER TABLE "segmentRepositories"
DROP CONSTRAINT "segmentRepositories_pkey";

-- 2. Add the new primary key
ALTER TABLE "segmentRepositories"
ADD CONSTRAINT "segmentRepositories_pkey" PRIMARY KEY ("repository", "insightsProjectId");

-- 3. Drop the NOT NULL constraint on segmentId
ALTER TABLE "segmentRepositories"
ALTER COLUMN "segmentId" DROP NOT NULL;
