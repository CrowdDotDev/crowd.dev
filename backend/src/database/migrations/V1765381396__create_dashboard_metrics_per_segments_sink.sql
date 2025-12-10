CREATE TABLE public."dashboardMetricsPerSegmentSnapshot" (
    "segmentId" TEXT PRIMARY KEY,
    "activitiesTotal" BIGINT,
    "activitiesLast30Days" BIGINT,
    "organizationsTotal" BIGINT,
    "organizationsLast30Days" BIGINT,
    "membersTotal" BIGINT,
    "membersLast30Days" BIGINT,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);