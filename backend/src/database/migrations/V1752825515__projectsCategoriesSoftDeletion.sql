-- 1. insightsProjects
alter table "insightsProjects" add column "deletedAt" timestamp without time zone;

alter table public."insightsProjects"
  drop constraint if exists "idx_insightsProjects_slug_unique",
  drop constraint if exists "unique_insightsProjects_name",
  drop constraint if exists "unique_project_segmentId";

drop index if exists "idx_insightsProjects_slug_unique";
drop index if exists "unique_insightsProjects_name";
drop index if exists "unique_project_segmentId";

create unique index "idx_insightsProjects_slug_unique"
on public."insightsProjects" (slug)
    where "deletedAt" is null;

create unique index "unique_insightsProjects_name"
    on public."insightsProjects" (name)
    where "deletedAt" is null;

create unique index "unique_project_segmentId"
    on public."insightsProjects" ("segmentId")
    where "deletedAt" is null;


-- 2. collections
alter table "collections" add column "deletedAt" timestamp without time zone;

alter table public.collections
  drop constraint if exists idx_collections_slug_unique,
  drop constraint if exists unique_collection_name;

drop index if exists idx_collections_slug_unique;
drop index if exists unique_collection_name;

-- Recreate partial unique indexes (excluding soft-deleted rows)
create unique index idx_collections_slug_unique
    on public.collections (slug)
    where "deletedAt" is null;

create unique index unique_collection_name
    on public.collections (name)
    where "deletedAt" is null;


-- 3. categories
alter table "categories" add column "deletedAt" timestamp without time zone;

alter table public."categories"
  drop constraint if exists "categories_slug_key";

drop index if exists "categories_slug_key";

create unique index "categories_slug_key"
    on public."categories" (slug)
    where "deletedAt" is null;


-- 4. categoryGroups
alter table "categoryGroups" add column "deletedAt" timestamp without time zone;

alter table public."categoryGroups"
  drop constraint if exists "categoryGroups_slug_key";

drop index if exists "categoryGroups_slug_key";

create unique index "categoryGroups_slug_key"
    on public."categoryGroups" (slug)
    where "deletedAt" is null;

