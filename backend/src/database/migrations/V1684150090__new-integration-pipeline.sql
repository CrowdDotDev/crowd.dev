create extension if not exists "uuid-ossp";

create schema integration;

create table integration.runs (
    id               uuid         not null default uuid_generate_v1(),
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

create table integration.streams (
    id               uuid         not null default uuid_generate_v1(),
    state            varchar(255) not null,

    "parentId"       uuid         null,
    identifier       varchar(255) not null,

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
    foreign key ("parentId") references integration.streams (id) on delete cascade,
    primary key (id)
);

create index "ix_integration_streams_runId" on integration.streams ("runId");
create index "ix_integration_streams_tenantId" on integration.streams ("tenantId");
create index "ix_integration_streams_integrationId" on integration.streams ("integrationId");
create index "ix_integration_streams_microserviceId" on integration.streams ("microserviceId");
create index "ix_integration_streams_identifier" on integration.streams ("identifier");
create index "ix_integration_streams_parentId" on integration.streams ("parentId");

create table integration."apiData" (
    id               uuid         not null default uuid_generate_v1(),
    state            varchar(255) not null,
    data             json         not null,

    "delayedUntil"   timestamptz  null,

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

    foreign key ("streamId") references integration.streams (id) on delete cascade,
    foreign key ("runId") references integration.runs (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    primary key (id)
);

create index "ix_integration_apiData_streamId" on integration."apiData" ("streamId");
create index "ix_integration_apiData_runId" on integration."apiData" ("runId");
create index "ix_integration_apiData_tenantId" on integration."apiData" ("tenantId");
create index "ix_integration_apiData_integrationId" on integration."apiData" ("integrationId");
create index "ix_integration_apiData_microserviceId" on integration."apiData" ("microserviceId");

create table integration.results (
    id               uuid         not null default uuid_generate_v1(),
    state            varchar(255) not null,
    data             json         not null,

    "processedAt"    timestamptz  null,
    error            json         null,

    "createdAt"      timestamptz  not null default now(),
    "updatedAt"      timestamptz  not null default now(),

    "apiDataId"      uuid         not null,
    "streamId"       uuid         not null,
    "runId"          uuid         not null,
    "tenantId"       uuid         not null,
    "integrationId"  uuid         null,
    "microserviceId" uuid         null,

    foreign key ("apiDataId") references integration."apiData" (id) on delete cascade,
    foreign key ("streamId") references integration.streams (id) on delete cascade,
    foreign key ("runId") references integration.runs (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    primary key (id)
);