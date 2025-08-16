ALTER TABLE "segmentRepositories"
ADD COLUMN last_archived_check TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX idx_segmentRepositories_last_archived_check
    ON "segmentRepositories" (last_archived_check);
