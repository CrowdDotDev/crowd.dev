-- Drop the existing primary key (id column)
ALTER TABLE "memberSegmentsAgg" DROP CONSTRAINT "memberSegmentsAgg_pkey";

-- Drop the id column
ALTER TABLE "memberSegmentsAgg" DROP COLUMN id;

-- Drop the existing unique constraint (we'll make it the primary key)
ALTER TABLE "memberSegmentsAgg" DROP CONSTRAINT "memberSegmentsAgg_memberId_segmentId_key";

-- Add composite primary key (segmentId first for segment-based queries)
ALTER TABLE "memberSegmentsAgg" ADD PRIMARY KEY ("segmentId", "memberId");

-- Drop redundant indexes (covered by primary key which starts with segmentId)
DROP INDEX IF EXISTS member_segments_agg_segment_member;
DROP INDEX IF EXISTS member_segments_agg_segment_id;

-- Add index on memberId for queries that filter by member only
CREATE INDEX idx_msa_member_id
    ON "memberSegmentsAgg" ("memberId");

-- Drop the existing primary key (id column)
ALTER TABLE "organizationSegmentsAgg" DROP CONSTRAINT "organizationSegmentsAgg_pkey";

-- Drop the id column
ALTER TABLE "organizationSegmentsAgg" DROP COLUMN id;

-- Drop the existing unique constraint (we'll make it the primary key)
ALTER TABLE "organizationSegmentsAgg" DROP CONSTRAINT "organizationSegmentsAgg_organizationId_segmentId_key";

-- Add composite primary key (segmentId first for segment-based queries)
ALTER TABLE "organizationSegmentsAgg" ADD PRIMARY KEY ("segmentId", "organizationId");

-- Drop redundant indexes (covered by primary key which starts with segmentId)
DROP INDEX IF EXISTS organization_segments_agg_segment_id;
DROP INDEX IF EXISTS idx_osa_segment_coalesce_activity_org;

-- Add index on organizationId for queries that filter by organization only
CREATE INDEX idx_osa_organization_id
    ON "organizationSegmentsAgg" ("organizationId");

-- Create index for segment + activity count ordering (commonly used in queries)
CREATE INDEX idx_org_segments_agg_segment_activity
    ON "organizationSegmentsAgg" ("segmentId", "activityCount" DESC, "organizationId");
