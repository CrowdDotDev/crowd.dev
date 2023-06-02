ALTER TABLE "memberToMerge" DROP CONSTRAINT "memberToMerge_pkey";

ALTER TABLE public."memberToMerge" ADD CONSTRAINT "memberToMerge_pkey" PRIMARY KEY ("memberId", "toMergeId");

ALTER TABLE "memberToMerge" DROP COLUMN "segmentId";


ALTER TABLE "memberNoMerge" DROP CONSTRAINT "memberNoMerge_pkey";

ALTER TABLE public."memberNoMerge" ADD CONSTRAINT "memberNoMerge_pkey" PRIMARY KEY ("memberId", "noMergeId");

ALTER TABLE "memberNoMerge" DROP COLUMN "segmentId";
