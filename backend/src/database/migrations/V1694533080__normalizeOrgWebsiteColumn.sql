CREATE UNIQUE INDEX idx_organization_tenant_website
ON organizations ("tenantId", website)
WHERE website IS NOT NULL;

DO
$$
    DECLARE
        org_record  organizations%ROWTYPE;
        correct_url text;
    BEGIN
        FOR org_record IN (SELECT *
                           FROM organizations
                           WHERE website LIKE 'http://%'
                              OR website LIKE 'https://%'
                              OR website LIKE 'www.%')
            LOOP
                correct_url := (SELECT CASE
                                           WHEN position('www.' in org_record.website) > 0 THEN
                                               split_part(split_part(org_record.website, 'www.', 2), '/', 1)
                                           ELSE
                                               split_part(split_part(org_record.website, '//', 2), '/', 1)
                                           END);
                RAISE NOTICE 'org id: %, fixed url: %', org_record.id, correct_url;
                UPDATE organizations SET website = correct_url WHERE id = org_record.id;
            END LOOP;
    END;
$$;
