create table "incomingWebhooks" (
    id              uuid         not null,
    "tenantId"      uuid         not null,
    "integrationId" uuid         not null,
    state           varchar(255) not null,

    type            varchar(255) not null,
    payload         json         not null,

    "processedAt"   timestamptz  null,
    error           json         null,

    "createdAt"     timestamptz  not null default now(),

    primary key (id)
);