create table "memberUserValidations"(
    id uuid primary key default uuid_generate_v4(),
    "memberId" uuid not null references members(id),
    action varchar(255) not null,
    type varchar(255) not null,
    details jsonb not null,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);
