UPDATE "insightsProjects"
SET widgets     = ARRAY_REMOVE(widgets, 'searchQueries'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE widgets IS NOT NULL;
