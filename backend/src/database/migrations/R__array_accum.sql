CREATE OR REPLACE AGGREGATE array_accum (ANYARRAY) (
    SFUNC = array_cat,
    STYPE = ANYARRAY,
    INITCOND = '{}'
    );
