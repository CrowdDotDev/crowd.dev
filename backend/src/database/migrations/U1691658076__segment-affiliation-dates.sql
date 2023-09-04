ALTER TABLE "memberSegmentAffiliations" ADD CONSTRAINT "memberSegmentAffiliations_memberId_segmentId_key" UNIQUE ("memberId", "segmentId");

ALTER TABLE "memberSegmentAffiliations" DROP COLUMN "dateStart";
ALTER TABLE "memberSegmentAffiliations" DROP COLUMN "dateEnd";

