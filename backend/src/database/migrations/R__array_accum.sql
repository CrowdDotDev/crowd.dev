CREATE OR REPLACE AGGREGATE array_accum (ANYARRAY) (
    SFUNC = array_append,
    STYPE = ANYARRAY,
    INITCOND = '{}'
);