ALTER TABLE integration."snowflakeExportJobs"
  ADD COLUMN metrics JSONB;

ALTER TABLE integration."snowflakeExportJobs"
  DROP COLUMN "totalRows",
  DROP COLUMN "totalBytes";
