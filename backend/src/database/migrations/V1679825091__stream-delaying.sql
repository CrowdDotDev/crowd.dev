create table "integrationRuns" (
    id              uuid         not null,
    "integrationId" uuid         not null,

    onboarding      boolean      not null,
    state           varchar(255) not null,

    "processedAt"   timestamptz  null,
    "streamCount"   int          null,
    error           json         null,

    "createdAt"     timestamptz  not null default now(),

    foreign key ("integrationId") references integrations (id),
    primary key (id)
);

create table "integrationStreams" (
    id              uuid         not null,
    "runId"         uuid         not null,
    "integrationId" uuid         not null,

    state           varchar(255) not null,

    name            text         not null,
    metadata        json         not null,

    "processedAt"   timestamptz  null,
    error           json         null,

    "createdAt"     timestamptz  not null default now(),
    "updatedAt"     timestamptz  not null default now(),

    foreign key ("runId") references "integrationRuns" (id),
    foreign key ("integrationId") references integrations (id),
    primary key (id)
);