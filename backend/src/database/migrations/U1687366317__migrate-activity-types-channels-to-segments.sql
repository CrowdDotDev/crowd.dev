ALTER TABLE settings ADD COLUMN "customActivityTypes" JSONB DEFAULT '{}'::JSONB;
ALTER TABLE settings ADD COLUMN "activityChannels" JSONB DEFAULT '{}'::JSONB;

