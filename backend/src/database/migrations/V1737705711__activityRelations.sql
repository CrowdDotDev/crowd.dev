create table public."activityRelations" (
    "activityId" uuid not null primary key,
    "memberId" uuid not null,
    "objectMemberId" uuid null,
    "organizationId" uuid null,
    "conversationId" uuid null,
    "parentId" uuid null,
    "segmentId" uuid not null,
    "platform" text not null,
    "username" text not null,
    "objectMemberUsername" text null,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    foreign key ("memberId") references members (id) on delete cascade,
    foreign key ("organizationId") references organizations (id) on delete set null,
    foreign key ("objectMemberId") references members (id) on delete set null,
    foreign key ("conversationId") references conversations (id) on delete set null,
    foreign key ("segmentId") references segments (id) on delete cascade,
    unique ("activityId", "memberId")
);
create index "ix_activityRelations_memberId" on "activityRelations"("memberId");
create index "ix_activityRelations_organizationId" on "activityRelations"("organizationId");
create index "ix_activityRelations_platform_username" on "activityRelations"("platform", "username");
