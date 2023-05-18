create schema integration;

create table integration.runs (
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

create index "ix_integration_runs_tenantId" on integration.runs ("tenantId");
create index "ix_integration_runs_integrationId" on integration.runs ("integrationId");
create index "ix_integration_runs_microserviceId" on integration.runs ("microserviceId");

create table integration."runStreams" (
    id               uuid         not null,
    state            varchar(255) not null,

    "parentId"       uuid         null,
    identifier       varchar(255) not null,
    type             text         not null,

    data             json         null,

    "delayedUntil"   timestamptz  null,

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
    foreign key ("runId") references integration.runs (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    foreign key ("parentId") references integration."runStreams" (id) on delete cascade,
    primary key (id)
);

create index "ix_integration_runStreams_runId" on integration."runStreams" ("runId");
create index "ix_integration_runStreams_tenantId" on integration."runStreams" ("tenantId");
create index "ix_integration_runStreams_integrationId" on integration."runStreams" ("integrationId");
create index "ix_integration_runStreams_microserviceId" on integration."runStreams" ("microserviceId");
create index "ix_integration_runStreams_identifier" on integration."runStreams" ("identifier");
create index "ix_integration_runStreams_parentId" on integration."runStreams" ("parentId");

create table integration."streamData" (
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

    foreign key ("streamId") references integration."runStreams" (id) on delete cascade,
    foreign key ("runId") references integration.runs (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    primary key (id)
);

create index "ix_integration_streamData_streamId" on integration."streamData" ("streamId");
create index "ix_integration_streamData_runId" on integration."streamData" ("runId");
create index "ix_integration_streamData_tenantId" on integration."streamData" ("tenantId");
create index "ix_integration_streamData_integrationId" on integration."streamData" ("integrationId");
create index "ix_integration_streamData_microserviceId" on integration."streamData" ("microserviceId");