CREATE DATABASE sequin;

CREATE ROLE sequin WITH LOGIN PASSWORD 'JustForLocalUse!' REPLICATION;

-- Let the user connect to the DB and create schemas in it
GRANT CONNECT, CREATE ON DATABASE sequin TO sequin;

-- Switch to that DB (psql meta-command; your migration runner must support it)
\c sequin

-- Allow creating tables in the public schema
GRANT USAGE, CREATE ON SCHEMA public TO sequin;

-- Existing objects permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sequin;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO sequin;

-- Default privileges: apply them to objects CREATED BY sequin
ALTER DEFAULT PRIVILEGES FOR ROLE sequin IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sequin;
ALTER DEFAULT PRIVILEGES FOR ROLE sequin IN SCHEMA public
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO sequin;
