create type public."segmentsStatus_type" AS ENUM ('active', 'archived', 'formation', 'prospect');

create table "segments" (
    "id" uuid not null,
    name text null,
    "parentName" text null,
    "grandparentName" text null,
    slug text not null,
    "parentSlug" text null,
    "grandparentSlug" text null,
    "status" public."segmentsStatus_type" not null default 'active',
    "description" text null,
    "sourceId" text null,
    "sourceParentId" text null,
    "customActivityTypes" JSONB default '{}',
    "activityChannels" JSONB default '{}',
    "tenantId" uuid not null,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamptz not null default now(),
    constraint "segments_pkey" primary key (id),
    foreign key ("tenantId") references tenants (id) on delete cascade,
    unique(slug, "parentSlug", "grandparentSlug", "tenantId")
);

ALTER TABLE "activities" ADD COLUMN "segmentId" uuid;

ALTER TABLE "integrations" ADD COLUMN "segmentId" uuid;

ALTER TABLE "conversations" ADD COLUMN "segmentId" uuid;