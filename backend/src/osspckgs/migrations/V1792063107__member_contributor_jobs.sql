CREATE TABLE IF NOT EXISTS member_contributor_jobs (
    id               UUID PRIMARY KEY,
    purl             TEXT NOT NULL,
    ecosystem        TEXT NOT NULL,
    collection_path  TEXT NOT NULL CHECK (collection_path IN ('github')),
    package_id       BIGINT REFERENCES packages (id),
    repo_id          BIGINT REFERENCES repos (id),
    status           TEXT NOT NULL CHECK (status IN ('pending', 'running', 'done', 'failed')),
    error            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS member_contributor_jobs_active_purl_uq
    ON member_contributor_jobs (purl) WHERE status IN ('pending', 'running');
