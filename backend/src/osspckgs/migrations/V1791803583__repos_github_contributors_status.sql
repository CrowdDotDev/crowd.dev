ALTER TABLE repos
    ADD COLUMN IF NOT EXISTS github_contributors_status TEXT,
    ADD COLUMN IF NOT EXISTS github_contributors_checked_at TIMESTAMPTZ;
