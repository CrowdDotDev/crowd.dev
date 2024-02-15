ALTER TABLE public."mergeActions"
ADD COLUMN "unmergeBackup" jsonb null;

alter table members
    add column "manuallyChangedFields" text[] null;
