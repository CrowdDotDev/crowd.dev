ALTER TABLE repos
    ADD COLUMN IF NOT EXISTS github_contributors_status TEXT,
    ADD COLUMN IF NOT EXISTS github_contributors_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS repos_github_contributors_checked_at_idx
    ON repos (github_contributors_checked_at ASC NULLS FIRST, id)
    WHERE host = 'github';
