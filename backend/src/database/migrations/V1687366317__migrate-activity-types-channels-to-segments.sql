DO $$
DECLARE
    _settings_row RECORD;
    _tenant_id UUID;
    _segment_ids UUID[];
    _segment_id UUID;
BEGIN
    FOR _settings_row IN SELECT * FROM settings LOOP
        RAISE NOTICE 'processing settings row %', _settings_row.id;

        _tenant_id := _settings_row."tenantId";

        RAISE NOTICE 'finding segment id for tenant %', _tenant_id;

        SELECT ARRAY(
            SELECT id
            FROM segments
            WHERE "tenantId" = _tenant_id
              AND "parentSlug" IS NOT NULL
              AND "grandparentSlug" IS NOT NULL
              AND slug = 'default'
        ) INTO _segment_ids;

        RAISE NOTICE 'found segments %', _segment_ids;

        IF COALESCE(ARRAY_LENGTH(_segment_ids, 1), 0) != 1 THEN
            RAISE NOTICE 'Couldnt find one default segment for tenant %, skipping', _tenant_id;
            CONTINUE;
        END IF;

        _segment_id := _segment_ids[1];
        RAISE NOTICE 'found segment id %', _segment_id;

        UPDATE segments
        SET "customActivityTypes" = COALESCE(jsonb_merge(_settings_row."customActivityTypes", "customActivityTypes"), '{}'::JSONB),
            "activityChannels" = COALESCE(jsonb_merge(_settings_row."activityChannels", "activityChannels"), '{}'::JSONB)
        WHERE id = _segment_id;

        RAISE NOTICE 'updated segment %', _segment_id;
    END LOOP;
END $$ LANGUAGE plpgsql;

ALTER TABLE settings DROP COLUMN "customActivityTypes";
ALTER TABLE settings DROP COLUMN "activityChannels";

