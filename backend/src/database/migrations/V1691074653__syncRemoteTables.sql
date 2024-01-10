create table "membersSyncRemote" (
    id uuid not null,
    "memberId" uuid not null,
    "sourceId" text,
    "integrationId" uuid not null,
    "syncFrom" text not null,
    "metaData" text,
    "lastSyncedAt" timestamptz,
    "status" text not null,
    constraint "membersSyncRemote_pkey" primary key (id),
    foreign key ("memberId") references members (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    unique("memberId", "integrationId", "syncFrom")
);


create table "organizationsSyncRemote" (
    id uuid not null,
    "organizationId" uuid not null,
    "sourceId" text,
    "integrationId" uuid not null,
    "syncFrom" text not null,
    "metaData" text,
    "lastSyncedAt" timestamptz,
    "status" text not null,
    constraint "organizationsSyncRemote_pkey" primary key (id),
    foreign key ("organizationId") references organizations (id) on delete cascade,
    foreign key ("integrationId") references integrations (id) on delete cascade,
    unique("organizationId", "integrationId", "syncFrom")
);