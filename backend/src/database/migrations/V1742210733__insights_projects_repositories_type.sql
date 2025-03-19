CREATE OR REPLACE FUNCTION jsonb_to_text_array(jsonb) RETURNS text[] AS $$
SELECT array_agg(value) FROM jsonb_array_elements_text($1)
$$ LANGUAGE SQL;

ALTER TABLE "insightsProjects"
    ALTER COLUMN "repositories" TYPE TEXT[]
        USING jsonb_to_text_array("repositories");

DROP FUNCTION IF EXISTS jsonb_to_text_array(jsonb);
