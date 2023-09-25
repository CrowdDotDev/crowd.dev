create type "customViewVisibility" as enum ('user', 'tenant');

create table "customViews" (
  id uuid not null primary key,
  name varchar(255) not null check (name <> ''),
  visibility "customViewVisibility" not null,
  config jsonb default '{}',
  placement varchar(255) check (placement in ('member', 'organization', 'activity', 'conversation')),
  "updatedById" uuid references "members"(id),
  "deletedById" uuid references "members"(id),
  "updatedAt" timestamp,
  "deletedAt" timestamp
);

create table "customViewOrders" (
  "order" integer not null default 0,
  "customViewId" uuid not null references "customViews"(id) on delete cascade,
  "memberId" uuid not null references "members"(id) on delete cascade
);