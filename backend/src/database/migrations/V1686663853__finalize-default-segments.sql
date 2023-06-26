UPDATE segments
SET url = 'default'
WHERE slug = 'default'
  AND "parentSlug" = 'default'
  AND "grandparentSlug" = 'default';

INSERT INTO segments (id, slug, "parentSlug", "grandparentSlug", "tenantId", name, "parentName", "grandparentName", description, url, "createdAt", "updatedAt")
SELECT
    uuid_generate_v4(),
    'default',
    'default',
    NULL,
    "tenantId",
    'Default',
    'Default',
    NULL,
    NULL,
    'default',
    NOW(),
    NOW()
FROM segments
WHERE slug = 'default'
  AND "parentSlug" = 'default'
  AND "grandparentSlug" = 'default';

INSERT INTO segments (id, slug, "parentSlug", "grandparentSlug", "tenantId", name, "parentName", "grandparentName", description, url, "createdAt", "updatedAt")
SELECT
    uuid_generate_v4(),
    'default',
    NULL,
    NULL,
    "tenantId",
    'Default',
    NULL,
    NULL,
    NULL,
    'default',
    NOW(),
    NOW()
FROM segments
WHERE slug = 'default'
  AND "parentSlug" = 'default'
  AND "grandparentSlug" = 'default';
