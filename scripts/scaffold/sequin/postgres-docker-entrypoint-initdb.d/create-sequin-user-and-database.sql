CREATE DATABASE sequin;

CREATE USER sequin WITH PASSWORD 'supersecretpassword';
GRANT ALL PRIVILEGES ON DATABASE sequin TO sequin;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sequin;
ALTER USER sequin WITH replication;

CREATE publication sequin_pub FOR ALL tables WITH (publish_via_partition_root = true);
SELECT pg_create_logical_replication_slot ('sequin_slot', 'pgoutput');
