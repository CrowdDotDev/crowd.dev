create unique index organization_caches_url
    on "organizationCaches" (url);

drop index public.organization_caches_name;