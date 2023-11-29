CREATE INDEX CONCURRENTLY IF NOT EXISTS members_tenant_emails on members USING GIN (emails array_ops);
