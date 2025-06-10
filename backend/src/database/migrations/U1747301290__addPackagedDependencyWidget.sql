UPDATE "insightsProjects"
SET widgets     = ARRAY_REMOVE(widgets, 'packageDependency'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE widgets IS NOT NULL;
