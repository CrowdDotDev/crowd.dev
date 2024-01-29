DO $$
DECLARE
    _member_id UUID;
    _first_acitivity TIMESTAMP;
BEGIN
    FOR _member_id IN
        SELECT id
        FROM members
        WHERE EXTRACT(YEAR FROM "joinedAt") = 1970 -- those who have the wrong joinedAt
          AND EXISTS ( -- yet have at least one activity with a non-1970 timestamp
            SELECT 1
            FROM activities a
            WHERE a."memberId" = members.id
              AND EXTRACT(YEAR FROM a.timestamp) != 1970
        )
    LOOP
        RAISE NOTICE 'member_id: %', _member_id;

        -- find the actual first non-1970 activity timestamp
        SELECT MIN(a.timestamp) INTO _first_acitivity
        FROM activities a
        WHERE EXTRACT(YEAR FROM a.timestamp) != 1970
          AND a."memberId" = _member_id;

        IF _first_acitivity IS NULL THEN
            CONTINUE;
        END IF;

        RAISE NOTICE 'first_acitivity: %', _first_acitivity;

        UPDATE members
        SET "joinedAt" = _first_acitivity
        WHERE id = _member_id;
    END LOOP;
END;
$$;
