ALTER TYPE public."memberAttributeSettings_type" RENAME TO "memberAttributeSettings_type_old";
CREATE TYPE "enum_memberAttributeSettings_type" AS ENUM ('boolean', 'number', 'email', 'string', 'url', 'date', 'multiSelect');
ALTER TABLE public."memberAttributeSettings" ALTER COLUMN type TYPE "memberAttributeSettings_type" USING type::text::"memberAttributeSettings_type";
DROP TYPE "memberAttributeSettings_type_old";