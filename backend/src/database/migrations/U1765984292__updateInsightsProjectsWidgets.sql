-- Rollback migration for updateInsightsProjectsWidgets
-- This removes the new widgets added by the forward migration

BEGIN;

-- Remove new widgets: reviewEfficiency, patchsetPerReview, medianTimeToClose, medianTimeToReview
UPDATE "insightsProjects" ip
SET
    widgets = (
        SELECT COALESCE(array_agg(w), ARRAY[]::TEXT[])
        FROM unnest(ip.widgets) AS w
        WHERE w NOT IN (
            'reviewEfficiency',
            'patchsetPerReview',
            'medianTimeToClose',
            'medianTimeToReview'
        )
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE ip.widgets && ARRAY['reviewEfficiency', 'patchsetPerReview', 'medianTimeToClose', 'medianTimeToReview'];

COMMIT;