UPDATE "memberOrganizations"
SET source = 'lfxOne',
    "updatedAt" = now()
WHERE source LIKE '%,%';
