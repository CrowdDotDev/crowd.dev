CREATE INDEX IF NOT EXISTS "ix_organizationToMergeRaw_organizationId" ON "organizationToMergeRaw" ("organizationId");

CREATE INDEX IF NOT EXISTS "ix_lfxMemberships_organizationId" ON "lfxMemberships" ("organizationId");