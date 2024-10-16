
create table "recommendedActions" (
    id               uuid         not null default uuid_generate_v1(),
    "tenantId"       uuid         not null,

    "memberId"       uuid         null,
    "organizationId" uuid         null,

    type             varchar(255) not null,
    state            varchar(255) not null default 'pending',

    data             json         null,

    "createdAt"      timestamptz  not null default now(),
    "updatedAt"      timestamptz  not null default now(),

    primary key (id),
    foreign key ("memberId") references members (id),
    foreign key ("organizationId") references organizations (id)
);

create index ix_recommended_actions_tenantid on "recommendedActions" ("tenantId");
create index ix_recommended_actions_tenantid_state on "recommendedActions" ("tenantId", state);