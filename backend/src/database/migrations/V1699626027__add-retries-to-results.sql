ALTER TABLE integration.results
ADD COLUMN retries INT,
ADD COLUMN "delayedUntil" TIMESTAMP with time zone NULL;
