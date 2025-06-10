UPDATE "insightsProjects"
SET widgets     = ARRAY_REMOVE(widgets, 'packageDownloads'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE widgets IS NOT NULL;
