create table "integrationRuns" (
    id                     uuid         not null,
    "tenantId"             uuid         not null,
    "integrationId"        uuid         null,
    "microserviceId"       uuid         null,

    onboarding             boolean      not null,
    state                  varchar(255) not null,

    "delayedUntil"         timestamptz  null,

    "processedAt"          timestamptz  null,
    error                  json         null,

    "createdAt"            timestamptz  not null default now(),
    "updatedAt"            timestamptz  not null default now(),

    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    primary key (id)
);

create table "integrationStreams" (
    id               uuid         not null,
    "runId"          uuid         not null,
    "tenantId"       uuid         not null,
    "integrationId"  uuid         null,
    "microserviceId" uuid         null,

    state            varchar(255) not null,

    name             text         not null,
    metadata         json         not null,

    "processedAt"    timestamptz  null,
    error            json         null,
    retries          int          null,

    "createdAt"      timestamptz  not null default now(),
    "updatedAt"      timestamptz  not null default now(),

    foreign key ("runId") references "integrationRuns" (id) on delete cascade,
    foreign key ("tenantId") references tenants (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    foreign key ("microserviceId") references microservices (id) on delete cascade,
    primary key (id)
);