create type public."segmentsStatus_type" AS ENUM ('active', 'archived', 'formation', 'prospect');

create table "segments" (
    "id" uuid not null,
    url text null,
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

ALTER TABLE "tags" ADD COLUMN "segmentId" uuid;

ALTER TABLE "tasks" ADD COLUMN "segmentId" uuid;

ALTER TABLE "reports" ADD COLUMN "segmentId" uuid;

ALTER TABLE "widgets" ADD COLUMN "segmentId" uuid;


CREATE TABLE public."memberSegments" (
    "memberId" uuid NOT NULL,
    "segmentId" uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL default now(),
    foreign key ("tenantId") references tenants (id),
    foreign key ("segmentId") references segments (id),
    foreign key ("memberId") references members (id),
    unique("memberId", "segmentId", "tenantId")
    -- create index for memberId, segmentId and tenantId
);

CREATE TABLE public."organizationSegments" (
    "organizationId" uuid NOT NULL,
    "segmentId" uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL default now(),
    foreign key ("tenantId") references tenants (id),
    foreign key ("segmentId") references segments (id),
    foreign key ("organizationId") references organizations (id),
    unique("organizationId", "segmentId", "tenantId")
    -- create index for organizationId, segmentId and tenantId
);






