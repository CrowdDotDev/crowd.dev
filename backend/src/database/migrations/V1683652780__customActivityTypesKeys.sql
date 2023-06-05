UPDATE
    settings
SET
    "customActivityTypes" = t.customActivityTypes
FROM
    (
        SELECT
            id,
            jsonb_object_agg(
                lower(key),
                CASE
                    WHEN jsonb_typeof(value) = 'object' THEN (
                        SELECT
                            jsonb_object_agg(lower(subkey), subvalue)
                        FROM
                            jsonb_each(value) AS subobjects(subkey, subvalue)
                        WHERE
                            jsonb_typeof(subvalue) = 'object'
                    )
                    ELSE value
                END
            ) AS customActivityTypes
        FROM
            settings,
            jsonb_each("customActivityTypes") AS objects(key, value)
        WHERE
            jsonb_typeof(value) = 'object'
        GROUP BY
            id
    ) t
WHERE
    settings.id = t.id
    AND "customActivityTypes" :: text <> '{}' :: text;