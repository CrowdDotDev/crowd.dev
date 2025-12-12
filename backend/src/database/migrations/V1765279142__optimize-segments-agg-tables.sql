-- Drop the existing primary key (id column)
ALTER TABLE "memberSegmentsAgg" DROP CONSTRAINT "memberSegmentsAgg_pkey";

-- Drop the id column
ALTER TABLE "memberSegmentsAgg" DROP COLUMN id;

-- Drop the existing unique constraint (we'll make it the primary key)
ALTER TABLE "memberSegmentsAgg" DROP CONSTRAINT "memberSegmentsAgg_memberId_segmentId_key";

-- Add composite primary key
ALTER TABLE "memberSegmentsAgg" ADD PRIMARY KEY ("segmentId", "memberId");

-- Drop redundant index (covered by primary key)
DROP INDEX IF EXISTS member_segments_agg_segment_member;

-- Drop the existing primary key (id column)
ALTER TABLE "organizationSegmentsAgg" DROP CONSTRAINT "organizationSegmentsAgg_pkey";

-- Drop the id column
ALTER TABLE "organizationSegmentsAgg" DROP COLUMN id;

-- Drop the existing unique constraint (we'll make it the primary key)
ALTER TABLE "organizationSegmentsAgg" DROP CONSTRAINT "organizationSegmentsAgg_organizationId_segmentId_key";

-- Add composite primary key
ALTER TABLE "organizationSegmentsAgg" ADD PRIMARY KEY ("segmentId", "organizationId");

-- Add index on segmentId for our IN queries (if not exists)
CREATE INDEX IF NOT EXISTS organization_segments_agg_segment_id
    ON "organizationSegmentsAgg" ("segmentId");

-- Drop the weird index with escaped quotes (appears to be malformed)
DROP INDEX IF EXISTS idx_osa_segment_coalesce_activity_org;

-- Create a proper index for segment + activity count ordering (commonly used in queries)
CREATE INDEX idx_org_segments_agg_segment_activity
    ON "organizationSegmentsAgg" ("segmentId", "activityCount" DESC, "organizationId");
