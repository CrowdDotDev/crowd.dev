CREATE DATABASE sequin;

CREATE USER sequin
WITH
    PASSWORD 'supersecretpassword';

GRANT CONNECT ON DATABASE sequin to sequin;

GRANT
SELECT
    ON ALL TABLES IN SCHEMA public TO sequin;

ALTER USER sequin
WITH
    replication;

create publication sequin_pub for table activities
with
    (publish_via_partition_root = true);

select
    pg_create_logical_replication_slot ('sequin_slot', 'pgoutput');
