-- Migration to update insights projects widgets
-- 1. Remove deprecated widgets: waitTimeFor1stReview and averageTimeToMerge
-- 2. Add new widgets: reviewEfficiency, patchsetPerReview, medianTimeToClose, medianTimeToReview
-- 3. Update platform associations for existing widgets

BEGIN;

-- Step 1: Remove deprecated widgets from all projects
UPDATE "insightsProjects" ip
SET
    widgets = array_remove(array_remove(ip.widgets, 'waitTimeFor1stReview'), 'averageTimeToMerge'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE
    ip.widgets && ARRAY['waitTimeFor1stReview', 'averageTimeToMerge'];

-- Step 2: Remove widgets from projects that don't have the required platforms
-- Remove pullRequests, mergeLeadTime, reviewTimeByPullRequestSize, codeReviewEngagement
-- from projects that are NOT connected to GitHub or GitLab
UPDATE "insightsProjects" ip
SET
    widgets = (
        SELECT array_agg(w)
        FROM unnest(ip.widgets) AS w
        WHERE w NOT IN (
            'pullRequests',
            'mergeLeadTime',
            'reviewTimeByPullRequestSize',
            'codeReviewEngagement'
        )
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM integrations i
    WHERE i."segmentId" = ip."segmentId"
        AND i.platform IN ('github', 'github-nango', 'gitlab')
        AND i."deletedAt" IS NULL
)
AND ip.widgets && ARRAY['pullRequests', 'mergeLeadTime', 'reviewTimeByPullRequestSize', 'codeReviewEngagement'];

-- Step 3: Add reviewEfficiency to projects connected to GitHub, GitLab, or Gerrit
UPDATE "insightsProjects" ip
SET widgets = (
    SELECT ARRAY(
        SELECT DISTINCT unnest(ip.widgets || ARRAY['reviewEfficiency'])
    )
),
"updatedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM integrations i
    WHERE i."segmentId" = ip."segmentId"
        AND i.platform IN ('github', 'github-nango', 'gitlab', 'gerrit')
        AND i."deletedAt" IS NULL
)
AND NOT (ip.widgets @> ARRAY['reviewEfficiency']);

-- Step 4: Add patchsetPerReview to projects connected to Gerrit
UPDATE "insightsProjects" ip
SET widgets = (
    SELECT ARRAY(
        SELECT DISTINCT unnest(ip.widgets || ARRAY['patchsetPerReview'])
    )
),
"updatedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM integrations i
    WHERE i."segmentId" = ip."segmentId"
        AND i.platform = 'gerrit'
        AND i."deletedAt" IS NULL
)
AND NOT (ip.widgets @> ARRAY['patchsetPerReview']);

-- Step 5: Add medianTimeToClose to projects connected to GitHub, GitLab, or Gerrit
UPDATE "insightsProjects" ip
SET widgets = (
    SELECT ARRAY(
        SELECT DISTINCT unnest(ip.widgets || ARRAY['medianTimeToClose'])
    )
),
"updatedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM integrations i
    WHERE i."segmentId" = ip."segmentId"
        AND i.platform IN ('github', 'github-nango', 'gitlab', 'gerrit')
        AND i."deletedAt" IS NULL
)
AND NOT (ip.widgets @> ARRAY['medianTimeToClose']);

-- Step 6: Add medianTimeToReview to projects connected to GitHub, GitLab, or Gerrit
UPDATE "insightsProjects" ip
SET widgets = (
    SELECT ARRAY(
        SELECT DISTINCT unnest(ip.widgets || ARRAY['medianTimeToReview'])
    )
),
"updatedAt" = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM integrations i
    WHERE i."segmentId" = ip."segmentId"
        AND i.platform IN ('github', 'github-nango', 'gitlab', 'gerrit')
        AND i."deletedAt" IS NULL
)
AND NOT (ip.widgets @> ARRAY['medianTimeToReview']);

COMMIT;