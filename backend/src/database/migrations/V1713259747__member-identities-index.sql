CREATE INDEX IF NOT EXISTS ix_memberIdentities_tenantId_platform_value_type ON "memberIdentities" ("tenantId", platform, value, type);
