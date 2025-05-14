-- Index to optimize fetching recently indexed entities
create index concurrently if not exists "idx_indexed_entities_type_indexed_at_entity_id"
on "indexed_entities" ("type", "indexed_at", "entity_id");
