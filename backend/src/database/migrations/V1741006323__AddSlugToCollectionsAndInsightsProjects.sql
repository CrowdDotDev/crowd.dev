ALTER TABLE collections ADD COLUMN slug TEXT;
ALTER TABLE "insightsProjects" ADD COLUMN slug TEXT;

CREATE OR REPLACE FUNCTION generate_slug(table_name TEXT,  input_text TEXT) RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    unique_slug TEXT;
    counter INT := 1;
    query TEXT;
    slug_exists BOOLEAN;
BEGIN
    base_slug := lower(regexp_replace(input_text, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := regexp_replace(base_slug, '-$', '', 'g');
    unique_slug := base_slug;

    -- Ensure uniqueness by appending a counter if needed
    LOOP
        query := format('SELECT EXISTS (SELECT 1 FROM %I WHERE slug = $1)', table_name);
        EXECUTE query INTO slug_exists USING unique_slug;

        EXIT WHEN NOT slug_exists;
        unique_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;

    RETURN unique_slug;
END;
$$ LANGUAGE plpgsql;

UPDATE collections SET slug = generate_slug('collections', name) WHERE name IS NOT NULL;
UPDATE "insightsProjects" SET slug = generate_slug('insightsProjects', name) WHERE name IS NOT NULL;

ALTER TABLE collections ALTER COLUMN slug SET NOT NULL;
ALTER TABLE collections ADD CONSTRAINT idx_collections_slug_unique UNIQUE (slug);

ALTER TABLE "insightsProjects" ALTER COLUMN slug SET NOT NULL;
ALTER TABLE "insightsProjects" ADD CONSTRAINT "idx_insightsProjects_slug_unique" UNIQUE (slug);
