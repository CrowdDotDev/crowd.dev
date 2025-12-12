-- Rollback optimization of memberSegmentsAgg and organizationSegmentsAgg tables

-- ============================================
-- Rollback memberSegmentsAgg table changes
-- ============================================

-- Drop the composite primary key
ALTER TABLE "memberSegmentsAgg" DROP CONSTRAINT "memberSegmentsAgg_pkey";

-- Add back the id column
ALTER TABLE "memberSegmentsAgg" ADD COLUMN id UUID DEFAULT gen_random_uuid() NOT NULL;

-- Set the id column as primary key
ALTER TABLE "memberSegmentsAgg" ADD CONSTRAINT "memberSegmentsAgg_pkey" PRIMARY KEY (id);

-- Re-add the unique constraint
ALTER TABLE "memberSegmentsAgg" ADD CONSTRAINT "memberSegmentsAgg_memberId_segmentId_key" UNIQUE ("memberId", "segmentId");

-- Re-create the redundant index
CREATE INDEX member_segments_agg_segment_member
    ON "memberSegmentsAgg" ("segmentId", "memberId");

-- ============================================
-- Rollback organizationSegmentsAgg table changes
-- ============================================

-- Drop the composite primary key
ALTER TABLE "organizationSegmentsAgg" DROP CONSTRAINT "organizationSegmentsAgg_pkey";

-- Add back the id column
ALTER TABLE "organizationSegmentsAgg" ADD COLUMN id UUID DEFAULT gen_random_uuid() NOT NULL;

-- Set the id column as primary key
ALTER TABLE "organizationSegmentsAgg" ADD CONSTRAINT "organizationSegmentsAgg_pkey" PRIMARY KEY (id);

-- Re-add the unique constraint
ALTER TABLE "organizationSegmentsAgg" ADD CONSTRAINT "organizationSegmentsAgg_organizationId_segmentId_key" UNIQUE ("organizationId", "segmentId");

-- Drop the new index
DROP INDEX IF EXISTS idx_org_segments_agg_segment_activity;

-- Recreate the old malformed index (as it was)
CREATE INDEX idx_osa_segment_coalesce_activity_org
    ON "organizationSegmentsAgg" ("segmentId" ASC, COALESCE("activityCount", 0) DESC, "organizationId" ASC);
