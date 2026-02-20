ALTER TABLE integration."snowflakeExportJobs"
  ADD CONSTRAINT "uq_snowflakeExportJobs_s3_path" UNIQUE (s3_path);
