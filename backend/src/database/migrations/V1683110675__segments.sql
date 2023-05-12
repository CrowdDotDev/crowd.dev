create type public."segmentsStatus_type" AS ENUM ('active', 'archived', 'formation', 'prospect');

create table "segments" (
    "id" uuid not null,
    name text not null,
    "parentName" text null,
    "grandparentName" text null,
    slug text not null UNIQUE,
    "parentSlug" text null,
    "grandparentSlug" text null,
    "status" public."segmentsStatus_type" not null default 'active',
    "description" text null,
    "sourceId" text null,
    "sourceParentId" text null,
    "tenantId" uuid not null,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamptz not null default now(),
    constraint "segments_pkey" primary key (id),
    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("parentName") references segments ("name") on update cascade,
    foreign key ("grandparentName") references segments ("name") on update cascade,
    foreign key ("parentSlug") references segments (slug) on update cascade,
    foreign key ("grandparentSlug") references segments (slug) on update cascade,

    CONSTRAINT unique_slug_name UNIQUE (slug, "ten")
);