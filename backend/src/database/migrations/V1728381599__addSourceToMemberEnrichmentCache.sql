ALTER TABLE "memberEnrichmentCache" ADD COLUMN "source" text DEFAULT null;

UPDATE "memberEnrichmentCache" SET "source" = 'progai';

ALTER TABLE "memberEnrichmentCache" ALTER COLUMN source SET NOT NULL;

ALTER TABLE public."memberEnrichmentCache" DROP CONSTRAINT "memberEnrichmentCache_pkey";

ALTER TABLE public."memberEnrichmentCache" ADD PRIMARY KEY ("memberId", "source");

ALTER TABLE "memberEnrichmentCache" ALTER COLUMN data DROP NOT NULL;
