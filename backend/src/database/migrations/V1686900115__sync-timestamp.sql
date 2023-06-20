alter table members
    add column "searchSyncedAt" timestamptz null;

alter table activities
    add column "searchSyncedAt" timestamptz null;