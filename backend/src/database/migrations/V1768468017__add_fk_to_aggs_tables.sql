ALTER TABLE public."memberSegmentsAgg"
ADD CONSTRAINT "memberSegmentsAgg_memberId_fkey"
FOREIGN KEY ("memberId")
REFERENCES public."members"(id)
ON DELETE CASCADE
NOT VALID;

ALTER TABLE public."organizationSegmentsAgg"
ADD CONSTRAINT "organizationSegmentsAgg_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES public."organizations"(id)
ON DELETE CASCADE
NOT VALID;

-- Validate the foreign key constraints after adding them when the data is consistent
-- ALTER TABLE public."memberSegmentsAgg"
-- VALIDATE CONSTRAINT "memberSegmentsAgg_memberId_fkey";

-- ALTER TABLE public."organizationSegmentsAgg"
-- VALIDATE CONSTRAINT "organizationSegmentsAgg_organizationId_fkey";