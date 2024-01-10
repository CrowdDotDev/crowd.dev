ALTER TABLE public."members" ADD COLUMN "manuallyCreated" boolean NOT NULL DEFAULT false;
ALTER TABLE public."organizations" ADD COLUMN "manuallyCreated" boolean NOT NULL DEFAULT false;
ALTER TABLE public."organizationCaches" ADD COLUMN "manuallyCreated" boolean NOT NULL DEFAULT false;