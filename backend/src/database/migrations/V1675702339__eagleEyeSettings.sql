ALTER TABLE public."users"
ADD COLUMN "eagleEyeSettings" JSONB DEFAULT '{"onboarded": false}';
