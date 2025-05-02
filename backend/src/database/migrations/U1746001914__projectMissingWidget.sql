UPDATE "insightsProjects"
SET widgets     = ARRAY_REMOVE(widgets, 'socialMentions'),
    widgets     = ARRAY_REMOVE(widgets, 'githubMentions'),
    widgets     = ARRAY_REMOVE(widgets, 'pressMentions'),
    widgets     = ARRAY_REMOVE(widgets, 'searchQueries'),
    widgets     = ARRAY_REMOVE(widgets, 'packageDownloads'),
    widgets     = ARRAY_REMOVE(widgets, 'mailingListMessages'),
    widgets     = ARRAY_REMOVE(widgets, 'activeDays'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE widgets IS NOT NULL;
