ALTER TABLE public."membersSyncRemote" ADD COLUMN "lastSyncedPayload" jsonb;
ALTER TABLE public."organizationsSyncRemote" ADD COLUMN "lastSyncedPayload" jsonb;