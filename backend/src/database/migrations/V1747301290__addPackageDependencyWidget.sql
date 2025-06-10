UPDATE "insightsProjects"
SET widgets     = ARRAY(
        SELECT DISTINCT unnest(
                                widgets || ARRAY [
                                    'packageDependency'
                                    ]
                        )
                  ),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE widgets IS NOT NULL;
