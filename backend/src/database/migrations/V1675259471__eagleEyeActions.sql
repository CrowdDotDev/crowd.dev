DROP TABLE IF EXISTS "eagleEyeContents";

CREATE TABLE public."eagleEyeContents" (
    "id" uuid NOT NULL,
    "platform" text NOT NULL,
    "url" text NOT NULL,
    "post" jsonb NOT NULL,
    "tenantId" uuid NOT NULL,
    "postedAt" timestamptz NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT "eagleEyeContents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE public."eagleEyeContents" ADD CONSTRAINT "eagleEyeContents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TYPE public."eagleEyeActionTypes_type" AS ENUM ('thumbs-up', 'thumbs-down', 'bookmark');

CREATE TABLE public."eagleEyeActions" (
    "id" uuid NOT NULL,
    "type" public."eagleEyeActionTypes_type" NOT NULL,
    "timestamp" timestamptz NOT NULL,
    "contentId" uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "actionById" uuid NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT "eagleEyeActions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE public."eagleEyeActions" ADD CONSTRAINT "eagleEyeActions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE public."eagleEyeActions" ADD CONSTRAINT "eagleEyeActions_actionBy_fkey" FOREIGN KEY ("actionById") REFERENCES public.users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE public."eagleEyeActions" ADD CONSTRAINT "eagleEyeActions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES public."eagleEyeContents"(id) ON DELETE CASCADE ON UPDATE NO ACTION;
