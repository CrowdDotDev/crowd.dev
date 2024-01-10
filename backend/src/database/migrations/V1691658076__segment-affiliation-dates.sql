ALTER TABLE "memberSegmentAffiliations" ADD COLUMN "dateStart" TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE "memberSegmentAffiliations" ADD COLUMN "dateEnd" TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE "memberSegmentAffiliations" DROP CONSTRAINT "memberSegmentAffiliations_memberId_segmentId_key";
