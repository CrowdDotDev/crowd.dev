DO $$
    DECLARE
        _record RECORD;
        _experience JSONB;
        _to_cleanup UUID[];
        _with_dates_exist BOOLEAN;
    BEGIN
        -- iterate over every work experience, grouped by member and organization
        FOR _record IN SELECT
                           "memberId",
                           "organizationId",
                           COUNT(*) AS count,
                           JSONB_AGG(
                               JSON_BUILD_OBJECT(
                                   'id', "id",
                                   'dateStart', TO_CHAR("dateStart", 'YYYY-MM-DD'),
                                   'dateEnd', TO_CHAR("dateEnd", 'YYYY-MM-DD'),
                                   'title', "title"
                                   )
                               ) AS experiences
                       FROM "memberOrganizations"
                       GROUP BY "memberId", "organizationId"
                       ORDER BY 3 DESC
            LOOP
                _with_dates_exist := FALSE;
                _to_cleanup := ARRAY[]::UUID[];

                -- ignore those that don't have duplicates
                IF _record.count <=1 THEN
                    CONTINUE;
                END IF;

                -- iterate over every experience
                FOR _experience IN SELECT JSONB_ARRAY_ELEMENTS(_record.experiences) LOOP
                    RAISE NOTICE 'Processing record %, experience: %', _record."memberId", _experience;

                    -- if there is no start date, mark it for deletion
                    -- but also check if there are any experiences with dates
                    IF _experience->>'dateStart' IS NULL THEN
                        _to_cleanup := _to_cleanup || (_experience->>'id')::UUID;
                    ELSE
                        _with_dates_exist := TRUE;
                    END IF;
                END LOOP;

                -- and then only delete duplicates if there are experiences with dates
                IF _with_dates_exist THEN
                    RAISE NOTICE 'Deleting experiences: %', _to_cleanup;
                    DELETE FROM "memberOrganizations" WHERE "id" = ANY (_to_cleanup);
                END IF;
            END LOOP;
    END;
$$ LANGUAGE PLPGSQL
