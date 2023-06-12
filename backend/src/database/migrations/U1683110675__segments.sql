
drop table "segments"
ALTER TABLE "activities" DROP COLUMN "segmentId";

ALTER TABLE "integrations" DROP COLUMN "segmentId";

ALTER TABLE "conversations" DROP COLUMN "segmentId";

ALTER TABLE "tags" DROP COLUMN "segmentId";

ALTER TABLE "tasks" DROP COLUMN "segmentId";

ALTER TABLE "reports" DROP COLUMN "segmentId";

ALTER TABLE "widgets" DROP COLUMN "segmentId";

DROP TABLE public."memberSegments";

DROP TABLE public."organizationSegments";


DROP type public."segmentsStatus_type";
