-- Create the categoryGroups table
CREATE TABLE IF NOT EXISTS "categoryGroups"
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    type        TEXT CHECK (type IN ('vertical', 'horizontal')) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the categories table
CREATE TABLE IF NOT EXISTS "categories"
(
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(255) NOT NULL,
    slug              VARCHAR(255) NOT NULL UNIQUE,
    "categoryGroupId" UUID NOT NULL REFERENCES "categoryGroups"(id) ON UPDATE CASCADE ON DELETE CASCADE,
    "createdAt"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add the categoryId column to the collections table
ALTER TABLE collections
    ADD COLUMN "categoryId" UUID REFERENCES "categories"(id) ON UPDATE CASCADE ON DELETE SET NULL;
