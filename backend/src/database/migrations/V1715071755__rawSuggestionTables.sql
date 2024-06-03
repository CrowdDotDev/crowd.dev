create table "memberToMergeRaw" (
    "createdAt" timestamp with time zone not null,
    "updatedAt" timestamp with time zone not null,
    "memberId" uuid not null constraint "memberToMergeRaw_memberId_fkey1" references members on update cascade on delete cascade,
    "toMergeId" uuid not null constraint "memberToMergeRaw_toMergeId_fkey1" references members on update cascade on delete cascade,
    similarity double precision,
    "activityEstimate" integer,
    constraint "memberToMergeRaw_pkey1" primary key ("memberId", "toMergeId")
);
create index "ix_memberToMergeRaw_toMergeId" on "memberToMergeRaw" ("toMergeId");

create table "organizationToMergeRaw" (
    "createdAt" timestamp with time zone not null,
    "updatedAt" timestamp with time zone not null,
    "organizationId" uuid not null references organizations on update cascade on delete cascade,
    "toMergeId" uuid not null references organizations on update cascade on delete cascade,
    similarity double precision,
    status varchar(16) default 'ready'::character varying not null,
    constraint "organizationToMergeRaw_pkey" primary key ("organizationId", "toMergeId")
);
create index "ix_organizationToMergeRaw_toMergeId" on "organizationToMergeRaw" ("toMergeId");