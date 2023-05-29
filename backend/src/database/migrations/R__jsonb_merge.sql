CREATE OR REPLACE FUNCTION jsonb_merge(currentdata JSONB, newdata JSONB)
    RETURNS JSONB
    LANGUAGE sql
    IMMUTABLE
AS
$jsonb_merge_func$
SELECT
    CASE JSONB_TYPEOF(currentdata)
        WHEN 'object' THEN
            CASE JSONB_TYPEOF(newdata)
                WHEN 'object' THEN (
                    SELECT
                        JSONB_OBJECT_AGG(
                            k,
                            CASE
                                WHEN e2.v IS NULL THEN e1.v
                                WHEN e1.v IS NULL THEN e2.v
                                WHEN e1.v = e2.v THEN e1.v
                                ELSE jsonb_merge(e1.v, e2.v)
                            END)
                    FROM JSONB_EACH(currentdata) e1(k, v)
                    FULL JOIN JSONB_EACH(newdata) e2(k, v) USING (k)
                )
                ELSE newdata
            END
        WHEN 'array' THEN (
            SELECT JSONB_AGG(DISTINCT ele)
            FROM (
                SELECT JSONB_ARRAY_ELEMENTS(currentdata || newdata) AS ele
            ) AS sub
        )
        ELSE newdata
    END
$jsonb_merge_func$;

CREATE OR REPLACE AGGREGATE jsonb_merge_agg(jsonb)
    (
    SFUNC = jsonb_merge,
    STYPE = jsonb,
    INITCOND = '{}'
    );
