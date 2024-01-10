CREATE TABLE IF NOT EXISTS "githubRepos" (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "tenantId" UUID NOT NULL REFERENCES "tenants" (id),
    "integrationId" UUID NOT NULL REFERENCES "integrations" (id),
    "segmentId" UUID NOT NULL REFERENCES "segments" (id),
    url VARCHAR(1024) NOT NULL,

    UNIQUE ("tenantId", url)
);

