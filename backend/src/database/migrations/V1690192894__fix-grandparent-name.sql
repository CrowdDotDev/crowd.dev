DO $$
    DECLARE
        _segment RECORD;
        _grandparent RECORD;
        _parent RECORD;
    BEGIN
        FOR _segment IN SELECT * FROM segments s WHERE s."grandparentSlug" IS NOT NULL AND s."grandparentName" IS NULL
            LOOP
                SELECT * INTO _grandparent
                FROM segments s
                WHERE s.slug = _segment."grandparentSlug"
                  AND s."parentSlug" IS NULL
                  AND s."grandparentSlug" IS NULL;

                RAISE NOTICE 'Updating segment % with grandparent %', _segment.id, _grandparent.name;
                UPDATE segments SET "grandparentName" = _grandparent.name WHERE id = _segment.id;
            END LOOP;

        FOR _segment IN SELECT * FROM segments s WHERE s."parentSlug" IS NOT NULL AND s."parentName" IS NULL
            LOOP
                SELECT * INTO _parent
                FROM segments s
                WHERE s.slug = _segment."parentSlug"
                  AND s."parentSlug" = _segment."grandparentSlug"
                  AND s."parentSlug" IS NOT NULL
                  AND s."grandparentSlug" IS NULL;

                RAISE NOTICE 'Updating segment % with parent %', _segment.id, _parent.name;
                UPDATE segments SET "parentName" = _parent.name WHERE id = _segment.id;
            END LOOP;
    END;
$$ LANGUAGE plpgsql;

