ALTER TABLE public."memberAttributeSettings" DROP COLUMN options;

ALTER TABLE public."members" DROP COLUMN "isEnriched";

ALTER TABLE publoc."settings"
ALTER COLUMN "attributeSettings" SET DEFAULT '{"priorities": ["custom", "twitter", "github", "devto", "slack", "discord", "crowd"]}'::jsonb;

ALTER TYPE public."memberAttributeSettings_type" RENAME TO "memberAttributeSettings_type_old";
CREATE TYPE "enum_memberAttributeSettings_type" AS ENUM ('boolean', 'number', 'email', 'string', 'url', 'date');
ALTER TABLE public."memberAttributeSettings" ALTER COLUMN type TYPE "memberAttributeSettings_type" USING type::text::"memberAttributeSettings_type";
DROP TYPE "memberAttributeSettings_type_old";