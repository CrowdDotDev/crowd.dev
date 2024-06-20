DROP MATERIALIZED VIEW IF EXISTS mv_segments_cube;
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_segments_cube AS
SELECT
    id,
    name
FROM segments
;

CREATE UNIQUE INDEX IF NOT EXISTS mv_segments_cube_id ON mv_segments_cube (id);
