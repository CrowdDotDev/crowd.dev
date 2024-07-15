alter table "segments" drop column "parentId";
alter table "segments" drop column "grandparentId";
alter table "segments" drop column "type";
DROP INDEX IF EXISTS "segments_parent_id";
DROP INDEX IF EXISTS "segments_grandparent_id";
DROP INDEX IF EXISTS "segments_type";