CREATE TABLE IF NOT EXISTS identity_affiliations (
    identity_type        TEXT NOT NULL,
    identity_value       TEXT NOT NULL,
    akrites_member       TEXT,
    cdp_organization_id  UUID,
    confidence           TEXT,
    confidence_score     NUMERIC(2, 1),
    cdp_member_id        UUID,
    matched_domain       TEXT,
    matched_alias        TEXT,
    resolved_at          TIMESTAMPTZ NOT NULL,
    changed_at           TIMESTAMPTZ NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (identity_type, identity_value),
    CONSTRAINT identity_affiliations_identity_type_chk
        CHECK (identity_type IN ('github-login', 'email')),
    CONSTRAINT identity_affiliations_result_chk CHECK (
        (confidence IS NULL AND akrites_member IS NULL AND cdp_organization_id IS NULL
            AND confidence_score IS NULL AND cdp_member_id IS NULL
            AND matched_domain IS NULL AND matched_alias IS NULL)
     OR (confidence = 'cdp' AND confidence_score = 1.0 AND akrites_member IS NOT NULL
            AND cdp_organization_id IS NOT NULL AND cdp_member_id IS NOT NULL
            AND matched_domain IS NULL AND matched_alias IS NULL)
     OR (confidence = 'email_domain' AND confidence_score = 0.7 AND akrites_member IS NOT NULL
            AND cdp_organization_id IS NOT NULL AND matched_domain IS NOT NULL
            AND cdp_member_id IS NULL AND matched_alias IS NULL)
     OR (confidence = 'github_company' AND confidence_score = 0.3 AND akrites_member IS NOT NULL
            AND cdp_organization_id IS NOT NULL AND matched_alias IS NOT NULL
            AND cdp_member_id IS NULL AND matched_domain IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS identity_affiliations_member_idx
    ON identity_affiliations (akrites_member) WHERE akrites_member IS NOT NULL;

CREATE TABLE IF NOT EXISTS identity_affiliations_staging (
    identity_type        TEXT NOT NULL,
    identity_value       TEXT NOT NULL,
    akrites_member       TEXT,
    cdp_organization_id  UUID,
    confidence           TEXT,
    confidence_score     NUMERIC(2, 1),
    cdp_member_id        UUID,
    matched_domain       TEXT,
    matched_alias        TEXT,
    resolved_at          TIMESTAMPTZ,
    PRIMARY KEY (identity_type, identity_value)
);
