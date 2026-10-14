ALTER TABLE public."projectCatalog"
    ADD COLUMN IF NOT EXISTS "requestText" TEXT,
    ADD COLUMN IF NOT EXISTS "projectName" TEXT,
    ADD COLUMN IF NOT EXISTS "classificationKind" TEXT,
    ADD COLUMN IF NOT EXISTS "proposedAction" TEXT,
    ADD COLUMN IF NOT EXISTS "pccProjectId" TEXT,
    ADD COLUMN IF NOT EXISTS "classifiedAt" TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT,
    ADD COLUMN IF NOT EXISTS "reviewMessageTs" TEXT;

ALTER TABLE public."projectCatalog"
    ADD CONSTRAINT "projectCatalog_classificationKind_check"
    CHECK ("classificationKind" IN (
        'non_github_source',
        'non_lf_new_project',
        'lf_not_in_pcc',
        'lf_not_in_cdp',
        'lf_in_cdp',
        'already_tracked',
        'ambiguous'
    ));

ALTER TABLE public."projectCatalog"
    ADD CONSTRAINT "projectCatalog_proposedAction_check"
    CHECK ("proposedAction" IN (
        'create_segment',
        'create_integration',
        'update_integration',
        'human_review'
    ));
