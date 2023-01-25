CREATE TABLE public."memberEnrichmentCache" (
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	"memberId" uuid NOT NULL,
    "data" jsonb NOT NULL,
	CONSTRAINT "memberEnrichmentCache_pkey" PRIMARY KEY ("memberId")
);


-- public."taskAssignees" foreign keys
ALTER TABLE public."memberEnrichmentCache" ADD CONSTRAINT "memberEnrichmentCache_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
