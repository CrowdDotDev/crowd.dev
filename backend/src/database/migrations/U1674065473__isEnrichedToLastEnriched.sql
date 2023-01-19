ALTER TABLE public."members" ADD COLUMN "isEnriched" BOOLEAN DEFAULT false;
ALTER TABLE public."members" DROP COLUMN "lastEnriched";