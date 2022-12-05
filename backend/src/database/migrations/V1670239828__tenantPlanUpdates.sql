CREATE TYPE tenant_plans_type AS ENUM ('Essential', 'Growth');

ALTER TABLE tenants ALTER plan DROP DEFAULT;
ALTER TABLE tenants
    ALTER COLUMN plan TYPE public.tenant_plans_type USING plan::tenant_plans_type;

ALTER TABLE tenants ALTER column plan SET DEFAULT 'Essential';

ALTER TABLE tenants ADD COLUMN "isTrialPlan" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tenants ADD COLUMN "trialEndsAt"  timestamp with time zone DEFAULT null;

