create table if not exists "cleanupExcludeList" (
  "entityId" uuid not null,
  "type" varchar(50) not null,
  primary key ("entityId", "type")
);