create table "botSuggestions" (
    id uuid primary key not null default uuid_generate_v4(),
    "memberId" uuid not null references members (id) on delete cascade,
    confidence float not null,
    status text not null,
    "createdAt" timestamp with time zone not null,
    "updatedAt" timestamp with time zone not null,
    constraint "botSuggestions_memberId_key" unique("memberId")
);
