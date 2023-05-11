create type public."segmentsStatus_type" AS ENUM ('active', 'archived', 'formation', 'prospect');

create table "segments" (
    "id" uuid not null,
    name text not null,
    "parentName" text null,
    "grandparentName" text null,
    slug text not null,
    "parentSlug" text null,
    "grandparentSlug" text null,
    "status" public."segmentsStatus_type" not null default 'active',
    "description" text null,
    "sourceId" text null,
    "sourceParentId" text null,
    "tenantId" uuid not null,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamptz not null default now(),
    foreign key ("tenantId") references tenants (id) on delete cascade,
    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);