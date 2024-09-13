create table "maintainersInternal" (
    id uuid default uuid_generate_v4() primary key,
    role varchar(255) not null,
    "repoUrl" varchar(1024) not null,
    "repoId" uuid not null references "githubRepos"(id) on delete cascade,
    "identityId" uuid not null references "memberIdentities"(id) on delete cascade,
    "createdAt" timestamp with time zone not null default now(),
    "updatedAt" timestamp with time zone not null default now()
);

create index maintainers_internal_repo_id_idx on "maintainersInternal" ("repoId");
create index maintainers_internal_identity_id_idx on "maintainersInternal" ("identityId");

create unique index maintainers_internal_repo_identity_unique_idx on "maintainersInternal" ("repoId", "identityId");

alter table "githubRepos" 
add column "maintainerFile" text,
add column "lastMaintainerRunAt" timestamp with time zone;