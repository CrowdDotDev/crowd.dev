UPDATE "insightsProjects"
SET widgets     = ARRAY(
        SELECT DISTINCT unnest(
                                widgets || ARRAY [
                                    'socialMentions',
                                    'githubMentions',
                                    'pressMentions',
                                    'searchQueries',
                                    'packageDownloads',
                                    'mailingListMessages',
                                    'activeDays'
                                    ]
                        )
                  ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE widgets IS NOT NULL;
