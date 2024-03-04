create table if not exists indexed_entities (
    type       varchar(255) not null,
    entity_id  uuid         not null,
    tenant_id  uuid         not null,
    indexed_at timestamptz  not null default now(),

    primary key (type, entity_id)
);

create index if not exists ix_indexed_entities_tenant on indexed_entities (tenant_id);
create index if not exists ix_indexed_entities_type on indexed_entities (type);