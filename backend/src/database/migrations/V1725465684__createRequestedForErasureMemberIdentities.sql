create table public."requestedForErasureMemberIdentities" (
    "id" uuid,
    platform text not null,
    value text not null,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    type varchar(255) not null,
    primary key ("id")
);
create index ix_requested_for_erasure_memberidentities_platform_value_type on public."requestedForErasureMemberIdentities" (platform, value, type);
create index idx_requested_for_erasure_memberidentities_lower_value on public."requestedForErasureMemberIdentities" (lower(value));
create index ix_requested_for_erasure_memberidentities_platform_lowervalue_type on public."requestedForErasureMemberIdentities" (platform, lower(value), type);