CREATE TABLE public."dashboardMetricsTotalSnapshot" (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'snapshot',

    "activitiesTotal" BIGINT,
    "activitiesLast30Days" BIGINT,
    "organizationsTotal" BIGINT,
    "organizationsLast30Days" BIGINT,
    "membersTotal" BIGINT,
    "membersLast30Days" BIGINT,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);