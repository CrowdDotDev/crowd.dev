DROP TABLE IF EXISTS "eagleEyeContents";

DROP TYPE "eagleEyeContents_actions_type";

create table "eagleEyeContents";
(
    id uuid not null primary key,
    "sourceId" text not null,
    "vectorId" text not null,
    status varchar(255) default NULL::character varying,
    title text not null,
    username text not null,
    url text not null,
    text text,
    timestamp timestamp with time zone not null,
    platform text not null,
    keywords text [],
    "similarityScore" double precision,
    "userAttributes" jsonb,
    "postAttributes" jsonb,
    "importHash" varchar(255),
    "createdAt" timestamp with time zone not null,
    "updatedAt" timestamp with time zone not null,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid not null references tenants on update cascade,
    "createdById" uuid references users on update cascade on delete
    set null,
        "updatedById" uuid references users on update cascade on delete
    set null,
        "exactKeywords" text []
);

alter table "eagleEyeContents" owner to postgres;

create index discord on "eagleEyeContents" ("vectorId", status);

create index members_email_tenant_id on "eagleEyeContents" (id)
where ("deletedAt" IS NULL);

create index members_joined_at_tenant_id on "eagleEyeContents" (id)
where ("deletedAt" IS NULL);

create index members_username on "eagleEyeContents" using gin (id);

create index slack on "eagleEyeContents" (id);

create index twitter on "eagleEyeContents" (id);

create unique index eagle_eye_contents_import_hash_tenant_id on "eagleEyeContents" ("importHash", "tenantId")
where ("deletedAt" IS NULL);

create index eagle_eye_contents_platform_tenant_id_timestamp on "eagleEyeContents" (platform, "tenantId", timestamp)
where ("deletedAt" IS NULL);

create index eagle_eye_contents_status_tenant_id_timestamp on "eagleEyeContents" (status, "tenantId", timestamp)
where ("deletedAt" IS NULL);

create index eagle_eye_contents_tenant_id_timestamp on "eagleEyeContents" ("tenantId", timestamp)
where ("deletedAt" IS NULL);