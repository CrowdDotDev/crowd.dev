UPDATE "insightsProjects"
SET widgets     = ARRAY(
        SELECT DISTINCT unnest(
                                widgets || ARRAY [
                                    'searchQueries'
                                    ]
                        )
                  ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE widgets IS NOT NULL;
