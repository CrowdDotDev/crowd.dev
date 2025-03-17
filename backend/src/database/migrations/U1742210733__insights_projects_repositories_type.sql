ALTER TABLE
    "insightsProjects"
ALTER COLUMN
    "repositories" TYPE JSONB USING (to_jsonb("repositories"));