drop index if exists ix_indexed_entities_tenant;

alter table indexed_entities
    drop column tenant_id;