CREATE TABLE public.repositories(
	id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
	"url" VARCHAR(1024) NOT NULL UNIQUE,
	"segmentId" UUID NOT NULL REFERENCES "segments"(id) ON DELETE CASCADE,
	"gitIntegrationId" UUID NOT NULL REFERENCES public."integrations" (id) ON DELETE CASCADE,
	"sourceIntegrationId" UUID NOT NULL REFERENCES public."integrations" (id) ON DELETE CASCADE,
	"insightsProjectId" UUID NOT NULL REFERENCES "insightsProjects"(id) ON DELETE CASCADE,
    "archived" BOOLEAN NOT NULL DEFAULT FALSE,
	"forkedFrom" VARCHAR(1024) DEFAULT NULL,
	"excluded" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deletedAt" TIMESTAMP WITH TIME ZONE,
	"lastArchivedCheckAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX ix_repositories_segmentId 
		ON repositories ("segmentId") 
		WHERE "deletedAt" IS NULL;
	
CREATE INDEX ix_repositories_sourceIntegrationId 
	ON repositories ("sourceIntegrationId") 
	WHERE "deletedAt" IS NULL;

CREATE INDEX ix_repositories_insightsProjectId 
	ON repositories ("insightsProjectId") 
	WHERE "deletedAt" IS NULL;
