create type "customViewVisibility" as enum ('user', 'tenant');

create table "customViews" (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null check (name <> ''),
  visibility "customViewVisibility" not null,
  config jsonb default '{}',
  placement varchar(255) check (placement in ('member', 'organization', 'activity', 'conversation'))
);

create table "customViewOrders" (
  "order" integer not null default 0,
  "customViewId" uuid not null references "customViews"(id) on delete cascade,
  "memberId" uuid not null references "member"(id) on delete cascade
);