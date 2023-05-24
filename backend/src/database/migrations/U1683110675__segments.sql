
drop table "segments" 
ALTER TABLE "activities" DROP COLUMN "segmentId";

ALTER TABLE "integrations" DROP COLUMN "segmentId";

ALTER TABLE "conversations" DROP COLUMN "segmentId";

ALTER TABLE "tags" DROP COLUMN "segmentId";

ALTER TABLE "tasks" DROP COLUMN "segmentId";

ALTER TABLE "reports" DROP COLUMN "segmentId";

ALTER TABLE "widgets" DROP COLUMN "segmentId";

ALTER TABLE "memberToMerge" DROP CONSTRAINT "memberToMerge_pkey";

ALTER TABLE public."memberToMerge" ADD CONSTRAINT "memberToMerge_pkey" PRIMARY KEY ("memberId", "toMergeId");

ALTER TABLE "memberToMerge" DROP COLUMN "segmentId";


ALTER TABLE "memberNoMerge" DROP CONSTRAINT "memberNoMerge_pkey";

ALTER TABLE public."memberNoMerge" ADD CONSTRAINT "memberNoMerge_pkey" PRIMARY KEY ("memberId", "noMergeId");

ALTER TABLE "memberNoMerge" DROP COLUMN "segmentId";


DROP TABLE public."memberSegments";

DROP TABLE public."organizationSegments";


DROP type public."segmentsStatus_type";
