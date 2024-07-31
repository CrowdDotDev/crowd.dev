CREATE OR REPLACE AGGREGATE array_accum (anycompatiblearray) (
    SFUNC = array_cat,
    STYPE = anycompatiblearray,
    INITCOND = '{}'
);
