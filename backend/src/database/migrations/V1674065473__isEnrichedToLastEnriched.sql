ALTER TABLE public."members" DROP COLUMN "isEnriched";
ALTER TABLE public."members" ADD COLUMN "lastEnriched" TIMESTAMP DEFAULT NULL;