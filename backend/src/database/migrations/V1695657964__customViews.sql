create type "customViewVisibility" as enum ('user', 'tenant');

create table "customViews" (
  id uuid not null primary key,
  name varchar(255) not null check (name <> ''),
  visibility "customViewVisibility" not null,
  config jsonb default '{}',
  placement text not null check (placement in ('member', 'organization', 'activity', 'conversation')),
  "tenantId" uuid not null references "tenants"(id) on delete cascade,
  "createdById" uuid not null references "users"(id),
  "updatedById" uuid references "users"(id),
  "createdAt" timestamp with time zone not null default now(),
  "updatedAt" timestamp with time zone,
  "deletedAt" timestamp with time zone
);

create table "customViewOrders" (
  id uuid not null primary key,
  "order" integer not null,
  "customViewId" uuid not null references "customViews"(id) on delete cascade,
  "userId" uuid not null references "users"(id) on delete cascade,
  "createdAt" timestamp with time zone not null default now(),
  "updatedAt" timestamp with time zone,
  "deletedAt" timestamp with time zone,

  -- Ensures that the order is unique per user and custom view
  constraint unique_custom_view_order unique ("userId", "customViewId")
);

create or replace function "customViewOrders_update_order"()
returns trigger as $$
begin
  if new."order" is null then
    new."order" := (select coalesce(max("order"), -1) + 1 
    from "customViewOrders" where "userId" = new."userId");
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger that sets the custom view order value for new rows
create trigger "customViewOrders_update_order"
before insert on "customViewOrders"
for each row execute procedure "customViewOrders_update_order"();

-- TODO: add script to populate custom views for existing tenants