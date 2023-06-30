-- Add the column with NOT NULL and a default value
alter table members
    add column "searchSyncedAt" timestamptz not null default now();

alter table activities
    add column "searchSyncedAt" timestamptz not null default now();

-- Then, make the column nullable
alter table members
    alter column "searchSyncedAt" drop not null;

alter table activities
    alter column "searchSyncedAt" drop not null;