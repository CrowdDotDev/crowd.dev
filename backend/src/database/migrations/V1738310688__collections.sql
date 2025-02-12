CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "isLF" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "insightsProjects" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "segmentId" UUID REFERENCES segments(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    "logoUrl" TEXT,
    "organizationId" UUID REFERENCES organizations(id),
    "website" TEXT,
    "github" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "widgets" TEXT[]
);

ALTER TABLE IF EXISTS "insightsProjects" ADD COLUMN IF NOT EXISTS "widgets" TEXT[];

CREATE TABLE IF NOT EXISTS "collectionsInsightsProjects" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "collectionId" UUID NOT NULL REFERENCES collections(id),
    "insightsProjectId" UUID NOT NULL REFERENCES "insightsProjects"(id),
    "starred" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("collectionId", "insightsProjectId")
);
