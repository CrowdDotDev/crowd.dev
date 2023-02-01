DROP TABLE IF EXISTS "eagleEyeContents";

CREATE TABLE public."eageEyeContents" (
    "id" uuid NOT NULL,
    "content" jsonb NOT NULL,
    "tenantId" uuid NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT "eageEyeContents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE public."eageEyeContents" ADD CONSTRAINT "eageEyeContents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE TYPE "eagleEyeActions_action_type" AS ENUM ('thumbs-up', 'thumbs-down', 'bookmark');

CREATE TABLE public."eageEyeActions" (
    "id" uuid NOT NULL,
    "platform" text NOT NULL,
    "action" public."eagleEyeActions_actions_type" NOT NULL,
    "timestamp" timestamptz NOT NULL,
    "url" text NOT NULL,
    "contentId" uuid NOT NULL,
    "tenantId" uuid NOT NULL,
    "actionBy" uuid NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT "eageEyeActions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE public."eageEyeActions" ADD CONSTRAINT "eageEyeActions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE public."eageEyeActions" ADD CONSTRAINT "eageEyeActions_actionBy_fkey" FOREIGN KEY ("actionBy") REFERENCES public.users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE public."eageEyeActions" ADD CONSTRAINT "eageEyeActions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES public."eageEyeContents"(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
