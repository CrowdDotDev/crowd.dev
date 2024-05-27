create table public.sessions (
    id uuid not null primary key,
    "userId" uuid not null,
    "userEmail" text not null,
    "startTime" timestamp with time zone default now() not null,
    "endTime" timestamp with time zone,
    "ipAddress" text,
    country text
);

create table public.events (
    id uuid not null primary key,
    "sessionId" uuid not null references public.sessions(id) on delete cascade,
    type text not null,
    key text not null,
    properties jsonb default '{}'::jsonb,
    "createdAt" timestamp with time zone default now() not null,
    "userId" uuid not null,
    "userEmail" text not null
);