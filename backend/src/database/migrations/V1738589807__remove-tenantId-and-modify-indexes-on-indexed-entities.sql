create index if not exists ix_indexed_entities_type_entity_id on indexed_entities (type, entity_id);

drop index if exists ix_indexed_entities_tenant;

alter table indexed_entities
    drop column tenant_id;