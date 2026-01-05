-- Rollback migration for contributorWidgetEnable
-- Removes contributor widgets: activeContributors, activeOrganization, contributorsLeaderboard,
--                               organizationsLeaderboard, contributorDependency, organizationDependency,
--                               retention, geographicalDistribution

BEGIN;

-- Remove all contributor widgets from all projects
UPDATE "insightsProjects" ip
SET
    widgets = (
        SELECT COALESCE(array_agg(w), ARRAY[]::TEXT[])
        FROM unnest(ip.widgets) AS w
        WHERE w NOT IN (
            'activeContributors',
            'activeOrganization',
            'contributorsLeaderboard',
            'organizationsLeaderboard',
            'contributorDependency',
            'organizationDependency',
            'retention',
            'geographicalDistribution'
        )
    ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE ip.widgets && ARRAY[
    'activeContributors',
    'activeOrganization',
    'contributorsLeaderboard',
    'organizationsLeaderboard',
    'contributorDependency',
    'organizationDependency',
    'retention',
    'geographicalDistribution'
];

COMMIT;