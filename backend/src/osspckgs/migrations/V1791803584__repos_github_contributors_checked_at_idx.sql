-- Own file: CONCURRENTLY cannot run in a transaction and under flyway mixed=true would demote
-- V1791803583 to autocommit. The DROP replaces an INVALID index left by a failed build on retry.
DROP INDEX CONCURRENTLY IF EXISTS repos_github_contributors_checked_at_idx;

CREATE INDEX CONCURRENTLY repos_github_contributors_checked_at_idx
    ON repos (github_contributors_checked_at ASC NULLS FIRST, id)
    WHERE host = 'github';
