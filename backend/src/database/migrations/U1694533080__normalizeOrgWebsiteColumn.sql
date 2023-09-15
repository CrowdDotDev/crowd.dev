DROP INDEX idx_organization_tenant_website ON organizations;

-- it's a destructive operation in up migration, so we can't really undo it