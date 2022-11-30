ALTER TABLE public."organizationCaches" DROP COLUMN "location";
ALTER TABLE public."organizationCaches" DROP COLUMN "github";
ALTER TABLE public."organizationCaches" DROP COLUMN "website";

create unique index organizations_url_tenant_id
    on "organizations" (url,"tenantId");