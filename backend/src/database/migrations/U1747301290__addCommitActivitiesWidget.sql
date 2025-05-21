UPDATE "insightsProjects"
SET widgets     = ARRAY_REMOVE(widgets, 'commitActivities'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE widgets IS NOT NULL;
