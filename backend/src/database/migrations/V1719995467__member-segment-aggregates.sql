CREATE TABLE "memberSegmentsAgg" (
    "id" UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "memberId" UUID NOT NULL,
    "segmentId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "activityCount" BIGINT NOT NULL,
    "lastActive" TIMESTAMP WITH TIME ZONE NOT NULL,
    "activityTypes" TEXT[] NOT NULL,
    "activeOn" TEXT[] NOT NULL,
    "averageSentiment" FLOAT NOT NULL,
    UNIQUE ("memberId", "segmentId")
);
