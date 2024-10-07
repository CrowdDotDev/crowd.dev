create table public."dataIssues" (
    "id" uuid,
    entity text not null,
    "profileUrl" text not null,
    "dataIssue" text not null,
    "dataType" text not null,
    "githubIssueUrl" text not null,
    "description" text not null,
    "createdById" uuid not null,
    "createdAt" timestamp with time zone default now() not null,
    "updatedAt" timestamp with time zone default now() not null,
    "resolutionEmailSentAt" timestamp with time zone default null,
    "resolutionEmailSentTo" text null,
    primary key ("id"),
    foreign key ("createdById") references users (id) on delete cascade,
    unique ("githubIssueUrl")
);