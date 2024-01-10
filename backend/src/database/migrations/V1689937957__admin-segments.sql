ALTER TABLE "tenantUsers" ADD COLUMN "adminSegments" UUID[] DEFAULT '{}'::UUID[] NOT NULL;
