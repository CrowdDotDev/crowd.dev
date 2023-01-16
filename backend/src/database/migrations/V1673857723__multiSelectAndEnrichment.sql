ALTER TABLE public."memberAttributeSettings" ADD COLUMN options text[] DEFAULT '{}';

ALTER TABLE public."members" ADD COLUMN "isEnriched" boolean DEFAULT false;

ALTER TABLE public."settings"
ALTER COLUMN "attributeSettings" SET DEFAULT '{"priorities": ["custom", "twitter", "github", "linkedin", "reddit", "devto", "slack", "discord", "hackernews", "enrichment", "crowd"]}'::jsonb;

ALTER TYPE "enum_memberAttributeSettings_type" ADD VALUE 'multiSelect';
