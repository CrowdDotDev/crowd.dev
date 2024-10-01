alter table members
    drop column "searchSyncedAt";

alter table organizations
    drop column "searchSyncedAt";

alter table activities
    drop column "searchSyncedAt";