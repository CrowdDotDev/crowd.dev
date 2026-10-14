-- LFX One echoed the grouped display source (e.g. 'email-domain,enrichment-crustdata') back on work experience edits.
-- Fixed in https://github.com/linuxfoundation/lfx-self-serve/pull/3619; these rows are user edits, so they belong to lfxOne.
UPDATE "memberOrganizations"
SET source = 'lfxOne',
    "updatedAt" = now()
WHERE source LIKE '%,%';
