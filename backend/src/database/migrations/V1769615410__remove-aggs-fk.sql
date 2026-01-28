-- Remove foreign key constraints from memberSegmentsAgg and organizationSegmentsAgg tables

-- Remove foreign key constraint from memberSegmentsAgg table
ALTER TABLE public."memberSegmentsAgg"
  DROP CONSTRAINT IF EXISTS "memberSegmentsAgg_memberId_fkey";

-- Remove foreign key constraint from organizationSegmentsAgg table
ALTER TABLE public."organizationSegmentsAgg"
  DROP CONSTRAINT IF EXISTS "organizationSegmentsAgg_organizationId_fkey";
