ALTER TABLE "orgAttributes" DROP COLUMN IF EXISTS "type";

DROP INDEX "orgAttributes_organizationId_name_default";

DO $$
DECLARE
    _org_id UUID;
    _attr RECORD;
    _count BIGINT;
    _first_id UUID;
    _deleted BIGINT;
BEGIN
    FOR _org_id IN (SELECT DISTINCT "organizationId" FROM "orgAttributes")
    LOOP
        RAISE NOTICE 'Org: %', _org_id;

        FOR _attr IN (SELECT DISTINCT name, source, value FROM "orgAttributes" WHERE "organizationId" = _org_id)
        LOOP
            SELECT COUNT(*) INTO _count
            FROM "orgAttributes"
            WHERE "organizationId" = _org_id
              AND name = _attr.name
              AND source = _attr.source
              AND value = _attr.value;

            IF _count = 1 THEN
                CONTINUE;
            ELSE
                RAISE NOTICE 'Found % duplicates for attribute: name=%, source=%', _count - 1, _attr.name, _attr.source;
            END IF;

            SELECT id INTO _first_id
            FROM "orgAttributes"
            WHERE "organizationId" = _org_id
              AND name = _attr.name
              AND source = _attr.source
              AND value = _attr.value
            LIMIT 1;

            DELETE FROM "orgAttributes"
            WHERE "organizationId" = _org_id
              AND name = _attr.name
              AND source = _attr.source
              AND value = _attr.value
              AND id != _first_id;
            GET DIAGNOSTICS _deleted = ROW_COUNT;
            RAISE NOTICE 'Deleted % duplicates', _deleted;

        END LOOP;
    END LOOP;

    RAISE NOTICE 'Creating index';

    CREATE UNIQUE INDEX "orgAttributes_organizationId_name_source_value" ON "orgAttributes" ("organizationId", "name", "source", MD5(value));
END;
$$;
