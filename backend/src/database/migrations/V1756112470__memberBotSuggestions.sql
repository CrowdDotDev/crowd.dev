create table "memberBotSuggestions" (
    id uuid primary key not null default uuid_generate_v4(),
    "memberId" uuid not null references members (id) on delete cascade,
    confidence float not null,
    "createdAt" timestamp with time zone not null,
    constraint "memberBotSuggestions_memberId_key" unique("memberId")
);

create table "memberNoBot" (
    id uuid primary key not null default uuid_generate_v4(),
    "memberId" uuid not null references members (id) on delete cascade,
    "createdAt" timestamp with time zone not null,
    constraint "memberNoBot_memberId_key" unique("memberId")
);