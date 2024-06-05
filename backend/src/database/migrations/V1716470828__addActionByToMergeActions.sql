ALTER TABLE "mergeActions"
ADD COLUMN "actionBy" uuid DEFAULT null;

ALTER TABLE "mergeActions"
ADD CONSTRAINT "mergeActions_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES public.users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;