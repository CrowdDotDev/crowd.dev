ALTER TABLE "memberToMerge" ADD COLUMN "segmentId" uuid;

ALTER TABLE "memberToMerge" DROP CONSTRAINT "memberToMerge_pkey";

ALTER TABLE public."memberToMerge" ADD CONSTRAINT "memberToMerge_pkey" PRIMARY KEY ("memberId", "toMergeId", "segmentId");


ALTER TABLE "memberNoMerge" ADD COLUMN "segmentId" uuid;

ALTER TABLE "memberNoMerge" DROP CONSTRAINT "memberNoMerge_pkey";

ALTER TABLE public."memberNoMerge" ADD CONSTRAINT "memberNoMerge_pkey" PRIMARY KEY ("memberId", "noMergeId", "segmentId");
