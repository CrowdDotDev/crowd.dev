create database lfx_insights_software_value
    with owner lfx_insights_db_admin;

CREATE TABLE IF NOT EXISTS project_costs (
    repo_url TEXT PRIMARY KEY,
    estimated_cost BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS language_stats (
    id SERIAL PRIMARY KEY,
    repo_url TEXT NOT NULL REFERENCES project_costs(repo_url) ON DELETE CASCADE,
    language_name TEXT NOT NULL,
    bytes INTEGER NOT NULL DEFAULT 0,
    code_bytes INTEGER NOT NULL DEFAULT 0,
    lines INTEGER NOT NULL,
    code INTEGER NOT NULL,
    comment INTEGER NOT NULL,
    blank INTEGER NOT NULL,
    complexity INTEGER NOT NULL,
    count INTEGER NOT NULL,
    weighted_complexity INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_language UNIQUE (repo_url, language_name)
);
