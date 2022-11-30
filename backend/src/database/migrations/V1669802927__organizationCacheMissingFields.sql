ALTER TABLE public."organizationCaches" ADD "location" TEXT NULL;
ALTER TABLE public."organizationCaches" ADD "github" JSONB NULL;
ALTER TABLE public."organizationCaches" ADD "website" TEXT NULL;

drop index public.organizations_url_tenant_id;