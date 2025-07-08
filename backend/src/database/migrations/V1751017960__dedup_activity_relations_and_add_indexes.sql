-- set the dedup keys as w/e is in questdb in relations table
create unique index concurrently if not exists ix_unique_activity_relations_dedup_key on activityRelations ("timestamp", "platform", "type", "sourceId", "channel", "segmentId");
