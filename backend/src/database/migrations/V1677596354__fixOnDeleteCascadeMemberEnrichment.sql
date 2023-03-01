ALTER TABLE public."memberEnrichmentCache" DROP CONSTRAINT "memberEnrichmentCache_memberId_fkey";

ALTER TABLE public."memberEnrichmentCache" ADD CONSTRAINT "memberEnrichmentCache_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE ON UPDATE NO ACTION;