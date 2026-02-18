CREATE TABLE integration."snowflakeExportJobs" (
  id BIGSERIAL PRIMARY KEY,
  platform VARCHAR(100) NOT NULL,
  s3_path TEXT NOT NULL,
  "totalRows" BIGINT NOT NULL DEFAULT 0,
  "totalBytes" BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "processingStartedAt" TIMESTAMP WITH TIME ZONE, -- set when worker claims job (acts as lock)
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "cleanedAt" TIMESTAMP WITH TIME ZONE,
  error TEXT
);

CREATE INDEX "idx_snowflakeExportJobs_platform" ON integration."snowflakeExportJobs" (platform);
 CREATE INDEX "idx_snowflakeExportJobs_pending" ON integration."snowflakeExportJobs" ("createdAt")
  WHERE "processingStartedAt" IS NULL;
