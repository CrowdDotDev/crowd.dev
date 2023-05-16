-- recreating the tables with new columns and better column order for easier querying
drop table "integrationStreams";
drop table "integrationRuns";

create table "integrationRuns" (
    id               uuid         not null,
    onboarding       boolean      not null,
    state            varchar(255) not null,

    "delayedUntil"   timestamptz  null,

    "processedAt"    timestamptz  null,
    error            json         null,

    "createdAt"      timestamptz  not null default now(),
    "updatedAt"      timestamptz  not null default now(),

    "tenantId"       uuid         not null,
    "integrationId"  uuid         null,
    "microserviceId" uuid         null,

    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    primary key (id)
);

create index "ix_integrationRuns_tenantId" on "integrationRuns" ("tenantId");
create index "ix_integrationRuns_integrationId" on "integrationRuns" ("integrationId");
create index "ix_integrationRuns_microserviceId" on "integrationRuns" ("microserviceId");

create table "integrationStreams" (
    id               uuid         not null,
    state            varchar(255) not null,

    "parentId"       uuid         null,
    identifier       varchar(255) not null,
    type             text         not null,

    data             json         not null,

    "processedAt"    timestamptz  null,
    error            json         null,
    retries          int          null,

    "createdAt"      timestamptz  not null default now(),
    "updatedAt"      timestamptz  not null default now(),

    "runId"          uuid         not null,
    "tenantId"       uuid         not null,
    "integrationId"  uuid         null,
    "microserviceId" uuid         null,

    unique ("runId", identifier),
    foreign key ("runId") references "integrationRuns" (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    foreign key ("parentId") references "integrationStreams" (id) on delete cascade,
    primary key (id)
);

create index "ix_integrationStreams_runId" on "integrationStreams" ("runId");
create index "ix_integrationStreams_tenantId" on "integrationStreams" ("tenantId");
create index "ix_integrationStreams_integrationId" on "integrationStreams" ("integrationId");
create index "ix_integrationStreams_microserviceId" on "integrationStreams" ("microserviceId");
create index "ix_integrationStreams_identifier" on "integrationStreams" ("identifier");
create index "ix_integrationStreams_parentId" on "integrationStreams" ("parentId");

create table "integrationStreamData" (
    id               uuid         not null,
    state            varchar(255) not null,
    data             json         not null,

    "processedAt"    timestamptz  null,
    error            json         null,
    retries          int          null,

    "createdAt"      timestamptz  not null default now(),
    "updatedAt"      timestamptz  not null default now(),

    "streamId"       uuid         not null,
    "runId"          uuid         not null,
    "tenantId"       uuid         not null,
    "integrationId"  uuid         null,
    "microserviceId" uuid         null,

    foreign key ("streamId") references "integrationStreams" (id) on delete cascade,
    foreign key ("runId") references "integrationRuns" (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    primary key (id)
);

create index "ix_integrationStreamData_streamId" on "integrationStreamData" ("streamId");
create index "ix_integrationStreamData_runId" on "integrationStreamData" ("runId");
create index "ix_integrationStreamData_tenantId" on "integrationStreamData" ("tenantId");
create index "ix_integrationStreamData_integrationId" on "integrationStreamData" ("integrationId");
create index "ix_integrationStreamData_microserviceId" on "integrationStreamData" ("microserviceId");