-- flyway: no-transaction
CREATE PUBLICATION dbz_publication FOR ALL TABLES WITH (publish_via_partition_root = true);