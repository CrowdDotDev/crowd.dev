DO $$
DECLARE
    _member RECORD;
    _member_id UUID;
    _org_id UUID;
    _exp JSON;
    _start_date TIMESTAMP WITH TIME ZONE;
    _end_date TIMESTAMP WITH TIME ZONE;
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

    FOR _member IN SELECT id, "tenantId", attributes->'workExperiences'->'default' AS exp FROM members WHERE (attributes->>'workExperiences') IS NOT NULL
    LOOP
        _member_id := _member.id;

        FOR _exp IN SELECT * FROM json_array_elements(_member.exp::JSON)
        LOOP
            --  {
            --      "title": "Senior Developer Evangelist",
            --      "company": "Clarifai",
            --      "endDate": "2019-05-01T00:00:00Z",
            --      "location": "San Francisco, California",
            --      "startDate": "2018-08-01T00:00:00Z"
            --  }

            _org_id := (SELECT id FROM organizations WHERE "tenantId" = _member."tenantId" AND name ILIKE '%' || (_exp->>'company')::TEXT || '%' LIMIT 1);
            IF _org_id IS NULL THEN
                INSERT INTO organizations (id, "updatedAt", "createdAt", "tenantId", name)
                VALUES (uuid_generate_v4(), NOW(), NOW(), _member."tenantId", _exp ->> 'company')
                RETURNING id INTO _org_id;

                RAISE NOTICE 'Created org: %', _org_id;
            ELSE
                RAISE NOTICE 'Found org: %', _org_id;
            END IF;

            _start_date := __convert_iso_string_to_timestamp(_exp ->> 'startDate');
            _end_date := __convert_iso_string_to_timestamp(_exp ->> 'endDate');

            -- if row in `memberOrganizations` exists, skip
            IF EXISTS (SELECT 1 FROM "memberOrganizations" WHERE "memberId" = _member_id AND "organizationId" = _org_id) THEN
                UPDATE "memberOrganizations"
                SET "updatedAt" = NOW(),
                    "dateStart" = _start_date,
                    "dateEnd" = _end_date,
                    "title" = _exp->>'title'
                WHERE "memberId" = _member_id AND "organizationId" = _org_id;
                RAISE NOTICE 'Found member org: %', _org_id;
            ELSE
                INSERT INTO "memberOrganizations" ("updatedAt", "createdAt", "memberId", "organizationId", "dateStart", "dateEnd", "title")
                VALUES (NOW(), NOW(), _member_id, _org_id, _start_date, _end_date, _exp->>'title');
                RAISE NOTICE 'Created member org: %', _org_id;
            END IF;

            RAISE NOTICE 'member id: %, exp: %', _member_id, _exp;
        END LOOP;
    END LOOP;

    DROP FUNCTION IF EXISTS __convert_iso_string_to_timestamp(text);
END $$ LANGUAGE PLPGSQL;

