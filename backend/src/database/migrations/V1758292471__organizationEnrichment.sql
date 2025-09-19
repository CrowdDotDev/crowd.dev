create table "organizationEnrichments"(
    "organizationId" uuid primary key,
    "lastTriedAt"   timestamp with time zone,
    "lastUpdatedAt" timestamp with time zone
);

create table "organizationEnrichmentCache" (
    "organizationId" uuid not null references organizations(id) on delete no action on update no action,
    "data" jsonb not null,
    "source" text not null,
    "createdAt" timestamp with time zone not null,
    "updatedAt" timestamp with time zone not null,
    primary key ("organizationId", source)
);