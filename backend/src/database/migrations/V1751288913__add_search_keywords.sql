ALTER TABLE "insightsProjects"
ADD COLUMN "searchKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
