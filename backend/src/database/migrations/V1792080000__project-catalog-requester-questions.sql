ALTER TABLE "projectCatalog"
  ADD COLUMN "requestedBy" TEXT,
  ADD COLUMN "requestQuestion" JSONB,
  ADD COLUMN "requestHints" JSONB;
