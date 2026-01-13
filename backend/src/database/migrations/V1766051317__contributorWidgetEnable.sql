-- Migration to enable contributor widgets for all projects
-- Adds: activeContributors, activeOrganization, contributorsLeaderboard, organizationsLeaderboard,
--       contributorDependency, organizationDependency, retention, geographicalDistribution

BEGIN;

-- Add all contributor widgets to all projects that don't already have them
UPDATE "insightsProjects" ip
SET widgets = (
    SELECT ARRAY(
        SELECT DISTINCT unnest(
            ip.widgets ||
            ARRAY[
                'activeContributors',
                'activeOrganization',
                'contributorsLeaderboard',
                'organizationsLeaderboard',
                'contributorDependency',
                'organizationDependency',
                'retention',
                'geographicalDistribution'
            ]
        )
    )
),
"updatedAt" = CURRENT_TIMESTAMP
WHERE NOT (ip.widgets @> ARRAY[
    'activeContributors',
    'activeOrganization',
    'contributorsLeaderboard',
    'organizationsLeaderboard',
    'contributorDependency',
    'organizationDependency',
    'retention',
    'geographicalDistribution'
]);

COMMIT;