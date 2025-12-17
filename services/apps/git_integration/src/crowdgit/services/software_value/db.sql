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
    bytes BIGINT NOT NULL DEFAULT 0,
    code_bytes BIGINT NOT NULL DEFAULT 0,
    lines BIGINT NOT NULL,
    code BIGINT NOT NULL,
    comment BIGINT NOT NULL,
    blank BIGINT NOT NULL,
    complexity BIGINT NOT NULL,
    count BIGINT NOT NULL,
    weighted_complexity BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_language UNIQUE (repo_url, language_name)
);
