-- Add the column with NOT NULL and a default value
alter table organizations
    add column "searchSyncedAt" timestamptz not null default now();

-- Then, make the column nullable
alter table organizations
    alter column "searchSyncedAt" drop not null;