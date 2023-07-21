ALTER TABLE public."organizations" ADD COLUMN "attributes" JSONB DEFAULT '{}';

create index if not exists "ix_organizations_attributes_sourceId"
    on organizations (COALESCE(((attributes -> 'sourceId'::text) -> 'hubspot'::text)::text, ''));

create index if not exists "ix_organizations_attributes_syncRemote"
    on organizations (COALESCE(((attributes -> 'syncRemote'::text) -> 'hubspot'::text)::boolean, false));

create index if not exists "ix_organizations_tenantId_createdAt" on organizations ("tenantId", "createdAt");
