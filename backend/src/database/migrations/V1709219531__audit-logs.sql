CREATE TABLE IF NOT EXISTS "auditLogAction" (
    id UUID NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "userId" UUID NOT NULL,
    "ipAddress" VARCHAR(255),
    "userAgent" VARCHAR(255),
    "requestId" UUID NOT NULL,
    "actionType" VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    "entityId" UUID NOT NULL,
    "oldState" JSONB NOT NULL,
    "newState" JSONB NOT NULL,
    "diff" JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS "auditLogAction_userId" ON "auditLogAction" ("userId");
CREATE INDEX IF NOT EXISTS "auditLogAction_entityId" ON "auditLogAction" ("entityId");
