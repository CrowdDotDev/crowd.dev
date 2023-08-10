DO $$
    DECLARE
        _work_experience RECORD;
        _org_id UUID;
        _org_name TEXT;
        _date_start TIMESTAMP WITHOUT TIME ZONE;
        _date_end TIMESTAMP WITHOUT TIME ZONE;
    BEGIN
        CREATE OR REPLACE FUNCTION __convert_iso_string_to_timestamp(iso_string text) RETURNS timestamp AS $inner$
        BEGIN
            IF iso_string = 'Present' THEN
                RETURN NULL;
            ELSIF (length(iso_string) = 4) THEN -- Only year
                RETURN to_timestamp(iso_string, 'YYYY');
            ELSIF (length(iso_string) = 7) THEN -- Year and month
                RETURN to_timestamp(iso_string, 'YYYY-MM');
            ELSE -- Full timestamp
                RETURN iso_string::TIMESTAMP WITH TIME ZONE;
            END IF;
        END;
        $inner$ LANGUAGE plpgsql;


        FOR _work_experience IN SELECT
                                    m.id,
                                    m."tenantId",
                                    w.value->>'title' AS title,
                                    w.value->>'company' AS company,
                                    CASE WHEN w.value->>'endDate' != 'Present' THEN w.value->>'endDate' END AS "dateEnd",
                                    w.value->>'startDate' AS "dateStart"
                                FROM members m, LATERAL (SELECT value FROM jsonb_array_elements(m.attributes->'workExperiences'->'default')) as w
                                WHERE m.attributes->'workExperiences' IS NOT NULL
                                  AND w.value->'startDate' IS NOT NULL
            LOOP
                _org_name := _work_experience.company;
                IF _org_name IS NULL THEN
                    CONTINUE;
                END IF;
                
                _date_start = __convert_iso_string_to_timestamp(_work_experience."dateStart");
                _date_end = __convert_iso_string_to_timestamp(_work_experience."dateEnd");

                SELECT id INTO _org_id FROM organizations WHERE name = _org_name AND "tenantId" = _work_experience."tenantId";
                IF _org_id IS NULL THEN
                    _org_id := uuid_generate_v4();

                    INSERT INTO organizations (id, "updatedAt", "createdAt", "tenantId", name, "displayName")
                    VALUES (_org_id, NOW(), NOW(), _work_experience."tenantId", _org_name, _org_name);
                    RAISE NOTICE 'Created organization % id=%', _org_name, _org_id;
                ELSE
                    RAISE NOTICE 'Found organization % id=%', _org_name, _org_id;
                END IF;

                DELETE
                FROM "memberOrganizations"
                WHERE "memberId" = _work_experience.id
                  AND "organizationId" = _org_id
                  AND "dateStart" IS NULL
                  AND "dateEnd" IS NULL;

                IF _date_end IS NULL THEN
                    INSERT INTO "memberOrganizations" ("createdAt", "updatedAt", "memberId", "organizationId", "dateStart", "dateEnd", title)
                    VALUES (NOW(), NOW(), _work_experience.id, _org_id, _date_start, _date_end, _work_experience.title)
                    ON CONFLICT ("memberId", "organizationId", "dateStart") WHERE ("dateEnd" IS NULL) DO NOTHING;
                ELSE
                    INSERT INTO "memberOrganizations" ("createdAt", "updatedAt", "memberId", "organizationId", "dateStart", "dateEnd", title)
                    VALUES (NOW(), NOW(), _work_experience.id, _org_id, _date_start, _date_end, _work_experience.title)
                    ON CONFLICT ("memberId", "organizationId", "dateStart", "dateEnd") DO NOTHING;
                END IF;

            END LOOP;

        DROP FUNCTION IF EXISTS __convert_iso_string_to_timestamp(text);
    END;
$$
