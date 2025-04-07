ALTER TABLE "collections"
    ADD CONSTRAINT "unique_collection_name" UNIQUE ("name");

ALTER TABLE "insightsProjects"
    ADD CONSTRAINT "unique_insightsProjects_name" UNIQUE ("name");
