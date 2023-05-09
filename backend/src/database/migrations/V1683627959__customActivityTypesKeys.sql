UPDATE
    "settings"
SET
    "customActivityTypes" = jsonb_set(
        "customActivityTypes",
        '{other}',
        (
            SELECT
                jsonb_object_agg(lower(key), value)
            FROM
                jsonb_each("customActivityTypes" -> 'other') AS entries(key, value)
        )
    )