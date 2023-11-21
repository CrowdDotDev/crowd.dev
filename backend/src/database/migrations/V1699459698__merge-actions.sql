CREATE TABLE "mergeActions" (
  id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  "tenantId" UUID NOT NULL REFERENCES tenants (id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL, -- org or member
  "primaryId" UUID NOT NULL,
  "secondaryId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "state" VARCHAR(16) NOT NULL, -- pending, in-progress, done
  UNIQUE ("tenantId", type, "primaryId", "secondaryId")
);

CREATE INDEX "mergeActions_main_idx" ON "mergeActions" (type, "primaryId", "secondaryId");
