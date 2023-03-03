ALTER TABLE "members" ADD COLUMN "enrichedBy" text[] DEFAULT array[]::text[];
ALTER TABLE "reports" ADD COLUMN "viewedBy" text[] DEFAULT array[]::text[];
ALTER TABLE "tenantUsers"
ADD COLUMN "settings" JSONB DEFAULT '{"isEagleEyeGuideDismissed": false, "isQuickstartGuideDismissed": false, "eagleEye": { "onboarded": false } }';

ALTER TABLE "tenantUsers"
ADD COLUMN "invitedById" uuid DEFAULT null;

ALTER TABLE "tenantUsers" ADD CONSTRAINT "tenantUsers_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES public.users(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

UPDATE "tenantUsers"
SET "settings"= jsonb_set("settings", '{eagleEye}', u."eagleEyeSettings"::jsonb)
FROM "users" u
WHERE "tenantUsers"."userId" = u.id
and (u."eagleEyeSettings"->>'onboarded')::boolean is true;

ALTER TABLE "users" DROP COLUMN "eagleEyeSettings"