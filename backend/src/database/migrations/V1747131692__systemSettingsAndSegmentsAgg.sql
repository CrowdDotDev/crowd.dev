-- Add "updatedAt" column to track the async aggs updates
alter table "memberSegmentsAgg"
    add column if not exists "updatedAt" timestamp with time zone not null default now();

-- For existing rows, set the initial value to the createdAt value
update "memberSegmentsAgg" set "updatedAt" = "createdAt";

-- Adding "createdAt" and "updatedAt" to make it consistent with the memberSegmentsAgg table.
alter table "organizationSegmentsAgg"
    add column if not exists "createdAt" timestamp with time zone not null default now();

alter table "organizationSegmentsAgg"
    add column if not exists "updatedAt" timestamp with time zone not null default now();

-- table store system wide settings since we are moving away from tenants
create table if not exists "systemSettings" (
    name varchar(255) not null primary key,
    value jsonb not null,
    description text,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now()
);

-- system settings for the display aggs last synced at
insert into "systemSettings" (name, value) values ('memberDisplayAggsLastSyncedAt', '{"timestamp": "2025-05-13T00:00:00Z"}');

insert into "systemSettings" (name, value) values ('organizationDisplayAggsLastSyncedAt', '{"timestamp": "2025-05-13T00:00:00Z"}');
