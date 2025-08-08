alter table tags
    drop constraint "tags_createdById_fkey",
    drop constraint "tags_tenantId_fkey",
    drop constraint "tags_updatedById_fkey";

alter table "memberTags"
    drop constraint "memberTags_memberId_fkey",
    drop constraint "memberTags_tagId_fkey";

alter table tags rename to old_tags;
alter table "memberTags" rename to "old_memberTags";