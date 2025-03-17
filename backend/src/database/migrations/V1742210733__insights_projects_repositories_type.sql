ALTER TABLE
    "insightsProjects"
ALTER COLUMN
    "repositories" TYPE TEXT [] USING (
        ARRAY(
            SELECT
                jsonb_array_elements_text("repositories")
        )
    );