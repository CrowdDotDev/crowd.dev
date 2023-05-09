UPDATE settings
SET "customActivityTypes" = jsonb_set("customActivityTypes", '{other}', t."newKey")
FROM (
    SELECT
        id,
        jsonb_object_agg(lower(key), value) as "newKey"
    FROM
        settings,
        jsonb_each("customActivityTypes" -> 'other') AS otherObjects(key, value)
    GROUP BY id
) t
WHERE
    settings.id = t.id
    AND "customActivityTypes" :: text <> '{}' :: text;